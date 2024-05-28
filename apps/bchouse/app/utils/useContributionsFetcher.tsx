import { $useLoaderQuery } from 'remix-query'

export function useContributionsFetcher(campaignId: string) {
  return $useLoaderQuery('/api/campaign/contributions/:campaignId/highlights', {
    params: {
      campaignId,
    },
    staleTime: 1 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  })
}
