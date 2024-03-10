import { Feed } from '~/components/threads/feed'
import { useProfileLoader } from './_layout'

export default function Index() {
  const profileData = useProfileLoader()

  if (!profileData) return null

  return <Feed feedOwner={profileData} id={profileData.id} queryKey="replies" />
}
