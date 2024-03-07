import { Feed } from '~/components/post/feed'
import { trpc } from '~/utils/trpc'

export const handle: AppRouteHandle = {
  preventScrollReset: true,
  skipScrollRestoration: true,
}

export default function Index() {
  let {
    data: applicationData = {
      anonymousView: true,
    },
  } = trpc.profile.useQuery(undefined, {
    staleTime: 5 * 60 * 1000,
  })

  if (applicationData.anonymousView) {
    return <></>
  }

  return (
    <Feed
      currentUser={applicationData.profile}
      feedOwner={applicationData.profile}
      id={applicationData.profile.id}
      queryKey="home"
    />
  )
}
