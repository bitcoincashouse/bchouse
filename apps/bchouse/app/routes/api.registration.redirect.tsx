import { LoaderFunctionArgs } from '@remix-run/node'
import { $path } from 'remix-routes'
import { redirect } from 'remix-typedjson'

export const loader = async (_: LoaderFunctionArgs) => {
  const path = _.params['*']?.split('/')[0] || ''

  if (path === 'complete') {
    const { userId } = await _.context.authService.getAuth(_)
    await _.context.userService.createAccountRedirect(userId)
    return redirect($path('/home'))
  }

  return null
}
