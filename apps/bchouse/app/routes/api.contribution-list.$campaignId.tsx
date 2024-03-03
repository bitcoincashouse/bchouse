import { LoaderFunctionArgs } from '@remix-run/node'
import { useEffect } from 'react'
import { typedjson, useTypedFetcher } from 'remix-typedjson'
import { z } from 'zod'
import { zx } from '~/utils/zodix'

export async function loader(_: LoaderFunctionArgs) {
  await _.context.ratelimit.limitByIp(_, 'api', true)

  const { campaignId } = zx.parseParams(_.params, {
    campaignId: z.string(),
  })

  const result = await _.context.campaignService.getAllContributions(campaignId)
  return typedjson(result)
}

export function useAllContributionsFetcher(campaignId: string) {
  const fetcher = useTypedFetcher<typeof loader>()

  useEffect(() => {
    fetcher.load('/api/contribution-list/' + campaignId)
  }, [])

  return fetcher
}
