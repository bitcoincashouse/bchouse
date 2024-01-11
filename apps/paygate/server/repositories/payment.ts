import { db } from '../db'
import { PaidInvoice } from './types'

export async function savePayment({
  invoiceId,
  txId,
  vout,
}: {
  invoiceId: string
  txId: string
  vout: number
}) {
  await db
    .insertInto('InvoicePayment')
    .values({
      invoiceId,
      txid: txId,
      vout,
    })
    .execute()
}

export async function getPayment(params: { id: string }) {
  const payment = await db
    .selectFrom('InvoicePayment as p')
    .innerJoin('Invoice as i', 'i.id', 'p.invoiceId')
    .where('i.id', '=', params.id)
    .select([
      'i.id',
      'i.address',
      'i.amount',
      'i.network',
      'p.txid',
      'p.vout',
      'p.paidAt',
    ])
    .executeTakeFirst()

  return payment
    ? ({
        //TODO: would be nice to validate a record is correct
        // can do this by saving the inputs, outputs, and block.
        id: payment.id,
        network: payment.network,
        address: payment.address,
        amount: payment.amount,
        paidAt: payment.paidAt,
        payment: {
          txid: payment.txid,
          vout: payment.vout,
        },
      } as PaidInvoice)
    : undefined
}
