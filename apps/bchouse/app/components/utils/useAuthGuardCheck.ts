import { useClerk } from '@clerk/remix'
import { useLocation } from '@remix-run/react'
import { useCurrentUser } from '../context/current-user-context'

export const useAuthGuardCheck = () => {
  const currentUser = useCurrentUser()
  const clerk = useClerk()
  const location = useLocation()

  return (e: { preventDefault: () => void }) => {
    if (currentUser.isAnonymous) {
      e.preventDefault()
      clerk.openSignIn({
        afterSignInUrl: location.pathname,
        afterSignUpUrl: location.pathname,
      })
    }
  }
}
