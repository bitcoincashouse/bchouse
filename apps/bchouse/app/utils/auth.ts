import { AuthObject, SignedInAuthObject } from '@clerk/clerk-sdk-node'
import { getAuth } from '@clerk/remix/ssr.server'
import {
  ActionFunctionArgs,
  LoaderFunctionArgs,
  redirect,
} from '@remix-run/node'

export async function getAuthOptional(
  params: LoaderFunctionArgs | ActionFunctionArgs
): Promise<AuthObject> {
  return await getAuth(params)
}

export async function getAuthRequired(
  params: LoaderFunctionArgs | ActionFunctionArgs
): Promise<SignedInAuthObject> {
  const auth = await getAuthOptional(params)

  if (!auth || !auth.userId) {
    const redirectUrl = new URL(params.request.url)
    throw redirect(`/auth/login?redirectUrl=${encodeURI(redirectUrl.pathname)}`)
  }

  return auth
}
