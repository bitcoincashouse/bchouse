import { trpc } from './trpc'

export function useContributionsFetcher(campaignId: string) {
  return trpc.campaign.listContributionHighlights.useQuery(
    {
      campaignId,
    },
    {
      staleTime: 1 * 60 * 1000,
      gcTime: 5 * 60 * 1000,
    }
  )
}
