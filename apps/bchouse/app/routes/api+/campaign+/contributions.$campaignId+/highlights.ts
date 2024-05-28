import { LoaderFunctionArgs } from '@remix-run/node'
import { z } from 'zod'
import { campaignService } from '~/.server/getContext'
import { zx } from '~/utils/zodix'

export const loader = async (_: LoaderFunctionArgs) => {
  const { campaignId } = zx.parseParams(
    _.params,
    z.object({ campaignId: z.string() })
  )

  const result = await campaignService.getUiContributions(campaignId)
  return result
}
