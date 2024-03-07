import { Feed } from '~/components/post/feed'
import { trpc } from '~/utils/trpc'

export const handle: AppRouteHandle = {
  preventScrollReset: true,
  skipScrollRestoration: true,
}

export default function Index() {
  let {
    data: layoutData = {
      anonymousView: true,
    },
  } = trpc.profile.useQuery(undefined, {
    staleTime: 5 * 60 * 1000,
  })

  return (
    <Feed
      currentUser={!layoutData.anonymousView ? layoutData.profile : undefined}
      feedOwner={!layoutData.anonymousView ? layoutData.profile : undefined}
      id={!layoutData.anonymousView ? layoutData.profile.id : 'anonymous'}
      queryKey="all_posts"
    />
  )
}
