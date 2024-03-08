import { trpc } from './trpc'

export function useAllContributionsFetcher(campaignId: string) {
  return trpc.campaign.listContributions.useQuery(
    {
      campaignId,
    },
    {
      staleTime: 1 * 60 * 1000,
      gcTime: 5 * 60 * 1000,
    }
  )
}
