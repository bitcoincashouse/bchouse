import { useLoggedInUser } from '~/components/context/current-user-context'
import { Feed } from '~/components/threads/feed'

export const handle: AppRouteHandle = {
  preventScrollReset: true,
  skipScrollRestoration: true,
}

export default function Index() {
  const currentUser = useLoggedInUser()
  return <Feed feedOwner={currentUser} id={currentUser.id} queryKey="home" />
}
