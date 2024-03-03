import { invoicePaymentEventsV1 } from '@bchouse/inngest'
import { getPrefix } from '@bchouse/utils'
import { ActionFunctionArgs, json } from '@remix-run/node'
import { z } from 'zod'

export const action = async (_: ActionFunctionArgs) => {
  const formData = await _.request.json()

  const { amount, address, network, event, memo } = z
    .object({
      amount: z.coerce.bigint(),
      address: z.string(),
      network: z.enum([
        'mainnet',
        'chipnet',
        'testnet3',
        'testnet4',
        'regtest',
      ]),
      event: invoicePaymentEventsV1,
      memo: z.string().nullable().optional(),
    })
    .parse(formData)

  const invoice = await _.context.paygateService.createInvoice({
    amount,
    address,
    network,
    event,
    memo,
  })

  const paygateUrl = _.context.paygateUrl
  const prefix = getPrefix(network)
  return json({
    paymentUrl: `${prefix}:?r=${paygateUrl}/api/payment-request/pay/${invoice.id}`,
    invoiceId: invoice.id,
  })
}
