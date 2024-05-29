import { $useLoaderQuery } from 'remix-query'

export function useSearchQuery(q?: string) {
  return $useLoaderQuery('/api/search/explore/:q?', {
    params: {
      q: q!,
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!q,
  })
}
