import { SignUp } from '@clerk/remix'
import { useClerkTheme } from '~/utils/useClerkTheme'

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
