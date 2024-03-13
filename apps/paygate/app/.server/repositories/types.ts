import { InvoicePaymentEventsV1 } from '@bchouse/inngest'
import { Network } from '../db/types'

export type InvoiceEvent = InvoicePaymentEventsV1

export type Invoice = UnpaidInvoice | PaidInvoice

export type UnpaidInvoice = {
  id: string
  network: Network
  address: string
  amount: bigint
  memo: string | null
  event: InvoiceEvent
  paidAt: null
  payment: null
}

export type PaidInvoice = {
  id: string
  network: Network
  address: string
  amount: bigint
  memo: string | null
  event: InvoiceEvent
  paidAt: Date
  payment: {
    txid: string
    vout: number
  }
}
