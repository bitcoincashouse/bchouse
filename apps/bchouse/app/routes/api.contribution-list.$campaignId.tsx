import { useEffect } from 'react'
import { useTypedFetcher } from 'remix-typedjson'

export function useAllContributionsFetcher(campaignId: string) {
  const fetcher = useTypedFetcher<typeof loader>()

  useEffect(() => {
    //TODO: trpc.contributionsList
    fetcher.load('/api/contribution-list/' + campaignId)
  }, [])

  return fetcher
}
