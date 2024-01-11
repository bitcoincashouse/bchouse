import { invoicePaymentEventsV1 } from '@bchouse/inngest'
import { NoResultError } from 'kysely'
import { v4 } from 'uuid'
import { Network, db } from '../db'
import { Invoice, InvoiceEvent } from './types'

function parseEvent(version: number, event: unknown) {
  switch (version) {
    case 0: {
      return invoicePaymentEventsV1.parse(event)
    }
    default: {
      throw new Error('Invalid version number')
    }
  }
}

export async function createInvoice({
  network,
  amount,
  address,
  memo,
  event,
}: {
  amount: bigint
  address: string
  network: Network
  memo?: string | null
  event: InvoiceEvent
}) {
  const id = v4()
  const version = 0

  await db
    .insertInto('Invoice')
    .values({
      id,
      network,
      amount,
      address,
      event: JSON.stringify(parseEvent(version, event)),
      memo,
      version,
    })
    .execute()
  return { id, network }
}

export async function getInvoice(params: {
  id: string
}): Promise<Invoice | null> {
  return await db
    .selectFrom('Invoice')
    .leftJoin('InvoicePayment', 'InvoicePayment.invoiceId', 'Invoice.id')
    .where('Invoice.id', '=', params.id)
    .select([
      'id',
      'network',
      'amount',
      'address',
      'memo',
      'event',
      'version',
      'txid',
      'vout',
      'paidAt',
    ])
    .executeTakeFirst()
    .then((invoice) => {
      if (!invoice) return null

      const baseInvoice = {
        id: invoice.id,
        network: invoice.network,
        address: invoice.address,
        amount: invoice.amount,
        version: invoice.version,
        memo: invoice.memo,
        event: parseEvent(invoice.version, invoice.event),
      }

      return !invoice.paidAt
        ? {
            ...baseInvoice,
            paidAt: invoice.paidAt,
            payment: null,
          }
        : {
            ...baseInvoice,
            paidAt: invoice.paidAt,
            payment: {
              txid: invoice.txid as string,
              vout: invoice.vout as number,
            },
          }
    })
}

export async function getUnpaidInvoice(params: { id: string }) {
  try {
    const invoice = await db
      .selectFrom('Invoice')
      .leftJoin('InvoicePayment', 'InvoicePayment.invoiceId', 'Invoice.id')
      .where((eb) =>
        eb('Invoice.id', '=', params.id).and(
          'InvoicePayment.invoiceId',
          'is',
          null
        )
      )
      .select([
        'id',
        'network',
        'amount',
        'address',
        'memo',
        'event',
        'version',
      ])
      .executeTakeFirstOrThrow()

    return {
      id: invoice.id,
      network: invoice.network,
      address: invoice.address,
      amount: invoice.amount,
      memo: invoice.memo,
      event: parseEvent(invoice.version, invoice.event),
    }
  } catch (err) {
    if (err instanceof NoResultError) {
      throw new Error('Invalid or already paid invoice')
    }

    throw err
  }
}
