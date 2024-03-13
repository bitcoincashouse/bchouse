import { ActionFunctionArgs, LoaderFunctionArgs } from '@remix-run/node'
import { createServerSideHelpers } from '@trpc/react-query/server'
import { getAuthOptional } from '~/utils/auth'
import { appRouter } from './router/index'

export async function getTrpc(
  args: LoaderFunctionArgs | ActionFunctionArgs,
  callback: (
    arg: ReturnType<typeof createServerSideHelpers<typeof appRouter>>
  ) => any | Promise<any>
) {
  const auth = await getAuthOptional(args)
  const trpc = createServerSideHelpers({
    router: appRouter,
    ctx: {
      auth,
    },
  })

  await callback(trpc)

  return {
    dehydratedState: trpc.dehydrate(),
  }
}
