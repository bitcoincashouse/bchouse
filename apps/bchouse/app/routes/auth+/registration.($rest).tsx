import { SignUp } from '@clerk/remix'
import { LoaderFunctionArgs } from '@remix-run/node'
import { $path } from 'remix-routes'
import { redirect } from 'remix-typedjson'
import { userService } from '~/.server/getContext'
import { getAuthRequired } from '~/utils/auth'
import { useClerkTheme } from '~/utils/useClerkTheme'

export const loader = async (_: LoaderFunctionArgs) => {
  const path = _.params['*']?.split('/')[0] || ''

  if (path === 'complete') {
    const { userId } = await getAuthRequired(_)
    await userService.createAccountRedirect(userId)
    return redirect($path('/home'))
  }

  return null
}

export default function Index() {
  const clerkTheme = useClerkTheme()

  return (
    <>
      <div className="flex min-h-full flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <SignUp
            routing={'path'}
            path={'/auth/registration'}
            appearance={{
              baseTheme: clerkTheme,
              variables: { colorInputText: '#000000' },
            }}
          />
        </div>
      </div>
    </>
  )
}
