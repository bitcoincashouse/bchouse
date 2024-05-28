import { LoaderFunctionArgs } from '@remix-run/node'
import { z } from 'zod'
import { bchouseUrl, paygateUrl, pledgeService } from '~/.server/getContext'
import { getAuthRequired } from '~/utils/auth'
import { zx } from '~/utils/zodix'

const pledgePaymentRequestInput = z.object({
  amount: z
    .string()
    .or(z.number())
    .or(z.bigint())
    .transform((amount) => BigInt(amount.toString())),
  address: z.string(),
  campaignId: z.string(),
})

export const loader = async (_: LoaderFunctionArgs) => {
  // await opts.ctx.ratelimit.limitByIp(_, 'api', true)
  const {
    amount: satoshis,
    address: returnAddress,
    campaignId,
  } = await zx.parseForm(_.request, pledgePaymentRequestInput)

  const { userId } = await getAuthRequired(_)

  const { paymentUrl, invoiceId, network, secret } =
    await pledgeService.createInvoice({
      campaignId,
      userId,
      paygateUrl: paygateUrl,
      amount: satoshis,
      refundAddress: returnAddress,
      bchouseUrl: bchouseUrl,
    })

  let headers = {} as Record<string, string>

  //TODO: Add some way for non-logged in users to view
  // Besides using WalletConnect
  // if (!userId) {
  //   const pledgeSession = await getPledgeSession(_.request)
  //   pledgeSession.addPledgeSecret(secret)
  //   headers['Set-Cookie'] = await pledgeSession.commit()
  // }

  return {
    paymentUrl,
    requestId: invoiceId,
    secret,
  }
}
