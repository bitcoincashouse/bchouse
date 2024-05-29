import { useEffect } from 'react'
import { $useActionMutation } from 'remix-query'
import { ClientOnly } from '~/components/client-only'

export function UpdateLastViewed() {
  return <ClientOnly>{() => <UpdateLastViewedComponent />}</ClientOnly>
}

function UpdateLastViewedComponent() {
  const mutation = $useActionMutation('/api/profile/lastViewedNotifications')

  useEffect(() => {
    mutation.mutate()
  }, [])

  return null
}
