import { useClerk } from '@clerk/remix'
import { useLocation } from '@remix-run/react'
import { useLayoutLoaderData } from '~/routes/_app/route'

export const useAuthGuardCheck = () => {
  const layoutData = useLayoutLoaderData()
  const clerk = useClerk()
  const location = useLocation()

  return (e: { preventDefault: () => void }) => {
    if (layoutData.anonymousView) {
      e.preventDefault()
      clerk.openSignIn({
        afterSignInUrl: location.pathname,
        afterSignUpUrl: location.pathname,
      })
    }
  }
}
