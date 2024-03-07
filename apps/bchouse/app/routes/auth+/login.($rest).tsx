import { SignIn } from '@clerk/remix'
import { useSearchParams } from '@remix-run/react'
import { useClerkTheme } from '~/utils/useClerkTheme'

export default function Index() {
  const [searchParams] = useSearchParams()
  const redirectUrl = searchParams.get('redirectUrl') || '/home'
  const clerkTheme = useClerkTheme()

  return (
    <>
      <div className="flex min-h-full">
        <div className="flex flex-1 flex-col justify-center py-12 px-4 sm:px-6 lg:flex-none lg:px-20 xl:px-24">
          <div className="mx-auto w-full max-w-sm lg:w-96">
            <div className="mt-6">
              <SignIn
                routing={'path'}
                path={'/auth/login'}
                redirectUrl={redirectUrl}
                appearance={{
                  baseTheme: clerkTheme,
                  variables: { colorInputText: '#000000' },
                }}
              />
            </div>
          </div>
        </div>
        <div className="relative hidden w-0 flex-1 lg:block min-h-screen">
          <img
            className="absolute inset-0 h-full w-full object-cover"
            src="https://images.unsplash.com/photo-1505904267569-f02eaeb45a4c?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=1908&q=80"
            alt=""
          />
        </div>
      </div>
    </>
  )
}
