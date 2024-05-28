import { $useLoaderQuery } from 'remix-query'

export function useAllContributionsFetcher(campaignId: string) {
  return $useLoaderQuery('/api/campaign/contributions/:campaignId', {
    params: {
      campaignId,
    },
    staleTime: 1 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  })
}
