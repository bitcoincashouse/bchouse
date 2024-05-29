import { $useLoaderQuery } from 'remix-query'

export function useAllPledges() {
  return $useLoaderQuery('/api/campaign/pledge/list', {
    gcTime: 5 * 60 * 1000,
    staleTime: 1 * 60 * 1000,
  })
}
