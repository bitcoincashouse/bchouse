import { useEffect } from 'react'
import { useTypedFetcher } from 'remix-typedjson'

export function useContributionsFetcher(campaignId: string) {
  const fetcher = useTypedFetcher<typeof loader>()

  useEffect(() => {
    if (campaignId) {
      //TODO: trpc.contributions
      fetcher.load('/api/contributions/' + campaignId)
    }
  }, [])

  return fetcher
}
