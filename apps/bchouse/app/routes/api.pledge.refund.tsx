import { ActionArgs } from '@remix-run/node'
import { typedjson, useTypedFetcher } from 'remix-typedjson'
import { z } from 'zod'
import { logger } from '~/utils/logger'
import { zx } from '~/utils/zodix'

export const action = async (_: ActionArgs) => {
  try {
    const { secret } = await zx.parseForm(_.request, {
      secret: z.string(),
    })

    const result = await _.context.pledgeService.cancelPledge({ secret })
    return typedjson(result)
  } catch (err) {
    logger.error(err)
    return typedjson({ error: true, txid: null })
  }
}

export function usePledgeRefundFetcher() {
  const fetcher = useTypedFetcher<typeof action>()
  return fetcher
}
