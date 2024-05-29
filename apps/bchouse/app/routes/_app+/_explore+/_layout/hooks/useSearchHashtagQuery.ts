import { $useLoaderQuery } from 'remix-query'

export function useSearchHashtagQuery(hashtag?: string) {
  return $useLoaderQuery('/api/search/hashtag/:hashtag', {
    params: { hashtag: hashtag! },
    enabled: !!hashtag,
  })
}
