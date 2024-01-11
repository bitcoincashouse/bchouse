import { z } from 'zod'

//InvoicePayment
export type PaymentInfo = {
  invoiceId: string
  txId: string
  vout: number
  txHex: string
  amount: string
  address: string
}

export type InvoicePayment = {
  data: {
    payment: PaymentInfo
  }
}

export type PledgeDeposit = z.infer<typeof pledgeDepositEventV1>
export const pledgeDepositEventV1 = z.object({
  name: z.literal('pledge/deposit'),
  data: z.object({
    campaignId: z.string(),
    userId: z.string().nullable().optional(),
    secret: z.string(),
    refundAddress: z.string(),
    pledgeType: z.enum(['STARTING', 'STARTED', 'DONATION']),
  }),
})

export type TipDeposit = z.infer<typeof tipDepositEventV1>
export const tipDepositEventV1 = z.object({
  name: z.literal('tip/deposit'),
  data: z.object({
    postId: z.string(),
    userId: z.string().nullable().optional(),
  }),
})

export const invoicePaymentEventsV1 = pledgeDepositEventV1.or(tipDepositEventV1)
export type InvoicePaymentEventsV1 = z.infer<typeof invoicePaymentEventsV1>

export type PledgeDepositEvent = InvoicePayment & PledgeDeposit
export type TipDepositEvent = InvoicePayment & TipDeposit
