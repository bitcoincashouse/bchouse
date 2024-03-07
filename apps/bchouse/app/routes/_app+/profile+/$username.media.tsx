import { Feed } from '~/components/post/feed'
import { useProfileLoader } from './$username'

export default function Index() {
  const profileData = useProfileLoader()

  return <Feed feedOwner={profileData} id={profileData.id} queryKey="media" />
}
