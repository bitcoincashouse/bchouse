import { useMemo } from 'react'
import { useCampaignThread } from '../../thread-provider'

export function useInitialPosts() {
  const posts = useCampaignThread()

  return useMemo(() => {
    return posts.ancestors.concat([posts.main])
  }, [posts])
}
