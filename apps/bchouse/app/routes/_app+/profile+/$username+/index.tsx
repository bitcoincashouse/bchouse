import { Feed } from '~/components/threads/feed'
import { useProfileQuery } from './_layout/hooks/useProfileQuery'

export default function Index() {
  const { data: profileData } = useProfileQuery()

  if (!profileData) return null

  return <Feed feedOwner={profileData} id={profileData.id} queryKey="user" />
}
