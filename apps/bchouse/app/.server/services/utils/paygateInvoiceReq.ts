import { z } from 'zod'
import { Network } from '../db/types'

type InvoiceEvent = z.infer<typeof eventV1>

type PaygateRequest = {
  network: Network
  address: string
  amount: number
  memo?: string | null
  event: InvoiceEvent
}

export const eventV1 = z
  .object({
    name: z.literal('tip/deposit'),
    data: z.object({
      postId: z.string(),
      userId: z.string().nullable().optional(),
    }),
  })
  .or(
    z.object({
      name: z.literal('pledge/deposit'),
      data: z.object({
        campaignId: z.string(),
        userId: z.string().nullable().optional(),
        secret: z.string(),
        refundAddress: z.string(),
        pledgeType: z.enum(['STARTING', 'STARTED', 'DONATION']),
      }),
    })
  )

export async function paygateInvoiceReq(
  paygateUrl: string,
  req: PaygateRequest
) {
  return await fetch(`${paygateUrl}/api/payment-request/create`, {
    method: 'POST',
    body: JSON.stringify(req),
    headers: {
      'Content-Type': 'application/json',
    },
  }).then(async (res) =>
    z
      .object({
        paymentUrl: z.string(),
        invoiceId: z.string(),
      })
      .parse(await res.json())
  )
}
