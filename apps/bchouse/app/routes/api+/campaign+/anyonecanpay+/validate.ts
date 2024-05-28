import { logger } from '@bchouse/utils'
import { ActionFunctionArgs } from '@remix-run/node'
import { z } from 'zod'
import { campaignService } from '~/.server/getContext'
import { zx } from '~/utils/zodix'

const anyonecanpayInput = z.object({
  campaignId: z.string(),
  payload: z.string(),
})

export type FormSchema = z.infer<typeof anyonecanpayInput>

export const action = async (_: ActionFunctionArgs) => {
  try {
    // await opts.ctx.ratelimit.limitByIp(_, 'api', true)

    const { campaignId, payload } = await zx.parseForm(
      _.request,
      anyonecanpayInput
    )

    const isValid = await campaignService.validateAnyonecanpayPledge(
      campaignId,
      payload
    )

    return { isValid }
  } catch (err) {
    logger.error(err)
    return { isValid: false }
  }
}
