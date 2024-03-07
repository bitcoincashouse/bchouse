import { useCurrentUser } from '~/components/context/current-user-context'
import { Feed } from '~/components/post/feed'

export const handle: AppRouteHandle = {
  preventScrollReset: true,
  skipScrollRestoration: true,
}

export default function Index() {
  const currentUser = useCurrentUser()

  return <Feed feedOwner={currentUser} id={currentUser.id} queryKey="home" />
}
