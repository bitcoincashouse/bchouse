import { Feed } from '~/components/post/feed'
import { layoutHandle } from '~/routes/_app/route'
import { useAppLoaderData } from '~/utils/appHooks'

export const handle: AppRouteHandle = {
  preventScrollReset: true,
  skipScrollRestoration: true,
}

export default function Index() {
  const layoutData = useAppLoaderData(layoutHandle)

  return (
    <Feed
      currentUser={!layoutData.anonymousView ? layoutData.profile : undefined}
      feedOwner={!layoutData.anonymousView ? layoutData.profile : undefined}
      id={!layoutData.anonymousView ? layoutData.profile.id : 'anonymous'}
      queryKey="all_posts"
    />
  )
}
