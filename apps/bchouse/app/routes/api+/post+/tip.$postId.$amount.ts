import { ActionFunctionArgs } from '@remix-run/node'
import { z } from 'zod'
import { paygateUrl, postService } from '~/.server/getContext'
import { getAuthOptional } from '~/utils/auth'
import { zx } from '~/utils/zodix'

const paramSchema = z.object({
  amount: z
    .string()
    .or(z.number())
    .or(z.bigint())
    .transform((amount) => BigInt(amount.toString())),
  postId: z.string(),
})

export const loader = async (_: ActionFunctionArgs) => {
  // await opts.ctx.ratelimit.limitByIp(_, 'api', true)
  const { userId } = await getAuthOptional(_)
  const { amount, postId } = await zx.parseParams(_.params, paramSchema)

  const { paymentUrl, invoiceId } = await postService.createTipInvoice({
    postId,
    userId,
    amount,
    paygateUrl: paygateUrl,
  })

  return {
    paymentUrl,
    requestId: invoiceId,
  }
}
