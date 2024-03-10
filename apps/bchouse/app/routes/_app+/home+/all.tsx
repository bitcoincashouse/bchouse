import { useCurrentUser } from '~/components/context/current-user-context'
import { Feed } from '~/components/threads/feed'

export const handle: AppRouteHandle = {
  preventScrollReset: true,
  skipScrollRestoration: true,
}

export default function Index() {
  const currentUser = useCurrentUser()

  return (
    <Feed
      feedOwner={!currentUser.isAnonymous ? currentUser : undefined}
      id={!currentUser.isAnonymous ? currentUser.id : 'anonymous'}
      queryKey="all_posts"
    />
  )
}
