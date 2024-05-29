import { useMemo } from 'react'
import { useCurrentUser } from '~/components/context/current-user-context'

export function useHomeTabs() {
  const currentUser = useCurrentUser()
  return useMemo(() => {
    return currentUser.isAnonymous
      ? [{ name: 'All', href: 'all' }]
      : [
          { name: 'All', href: 'all' },
          { name: 'Following', href: '' },
        ]
  }, [])
}
