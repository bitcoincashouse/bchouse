import { ActionFunctionArgs } from '@remix-run/node'
import { z } from 'zod'
import { campaignService } from '~/.server/getContext'
import { getAuthOptional } from '~/utils/auth'
import { zx } from '~/utils/zodix'

const anyonecanpayInput = z.object({
  campaignId: z.string(),
  payload: z.string(),
})

export type FormSchema = z.infer<typeof anyonecanpayInput>

export const action = async (_: ActionFunctionArgs) => {
  // await opts.ctx.ratelimit.limitByIp(_, 'api', true)

  const { campaignId, payload } = await zx.parseForm(
    _.request,
    anyonecanpayInput
  )

  const { userId } = await getAuthOptional(_)

  const result = await campaignService.submitAnyonecanpayPledge(
    campaignId,
    payload,
    userId
  )

  return result
}
