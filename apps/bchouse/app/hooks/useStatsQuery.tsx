import { $useLoaderQuery } from 'remix-query'

export function useStatsQuery() {
  return $useLoaderQuery('/api/metrics/stats', {
    staleTime: 5 * 60 * 1000,
  })
}
