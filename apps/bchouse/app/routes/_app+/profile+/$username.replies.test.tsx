import { Feed } from '~/components/post/feed'
import { useAppLoaderData } from '../../utils/appHooks'
import { layoutHandle } from '../_app/_layout'
import { useProfileLoader } from './$username'

export default function Index() {
  const layoutData = useAppLoaderData(layoutHandle)
  const profileData = useProfileLoader()

  return (
    <Feed
      currentUser={!layoutData.anonymousView ? layoutData.profile : undefined}
      feedOwner={profileData}
      id={profileData.id}
      queryKey="replies"
    />
  )
}
