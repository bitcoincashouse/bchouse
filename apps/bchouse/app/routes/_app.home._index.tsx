import { Feed } from '~/components/post/feed'
import { layoutHandle } from '~/routes/_app/route'
import { useAppLoaderData } from '~/utils/appHooks'

export const handle: AppRouteHandle = {
  preventScrollReset: true,
  skipScrollRestoration: true,
}

export default function Index() {
  const layoutData = useAppLoaderData(layoutHandle)
  if (layoutData.anonymousView) {
    return <></>
  }

  return (
    <Feed
      currentUser={layoutData.profile}
      feedOwner={layoutData.profile}
      id={layoutData.profile.id}
      queryKey="home"
    />
  )
}
