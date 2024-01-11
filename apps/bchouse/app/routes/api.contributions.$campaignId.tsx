import { LoaderArgs } from '@remix-run/node'
import { useEffect } from 'react'
import { typedjson, useTypedFetcher } from 'remix-typedjson'
import { z } from 'zod'
import { zx } from '~/utils/zodix'

export async function loader(_: LoaderArgs) {
  const { campaignId } = zx.parseParams(_.params, {
    campaignId: z.string(),
  })

  const result = await _.context.campaignService.getUiContributions(campaignId)
  return typedjson(result)
}

export function useContributionsFetcher(campaignId: string) {
  const fetcher = useTypedFetcher<typeof loader>()

  useEffect(() => {
    if (campaignId) {
      fetcher.load('/api/contributions/' + campaignId)
    }
  }, [])

  return fetcher
}
