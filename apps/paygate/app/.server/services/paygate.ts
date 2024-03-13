import { PaymentInfo, inngest } from '@bchouse/inngest'
import { Network, logger } from '@bchouse/utils'
import { z } from 'zod'
import {
  createInvoice,
  getInvoice,
  getUnpaidInvoice,
} from '../repositories/invoice'
import { savePayment } from '../repositories/payment'
import { InvoiceEvent } from '../repositories/types'
import { ElectrumNetworkProviderService } from '../utils/getElectrumProvider'
import * as bip70 from './payment/bip70'
import * as jppv1 from './payment/jppv1'
import * as jppv2 from './payment/jppv2'

const MediaTypes = {
  BIP70: {
    PaymentRequest: {
      type: 'GET',
      accept: 'application/bitcoincash-paymentrequest',
    },
    PaymentACK: {
      type: 'POST',
      accept: 'application/bitcoincash-paymentack',
    },
  },
  JPPv1: {
    PaymentRequest: {
      type: 'GET',
      accept: 'application/payment-request',
    },
    PaymentVerification: {
      type: 'POST',
      contentType: 'application/verify-payment',
    },
    Payment: {
      type: 'POST',
      contentType: 'application/payment',
    },
  },
  JPPv2: {
    PaymentOptions: {
      type: 'GET',
      accept: 'application/payment-options',
    },
    PaymentRequest: {
      type: 'POST',
      contentType: 'application/payment-request',
    },
    PaymentVerification: {
      type: 'POST',
      contentType: 'application/payment-verification',
    },
    Payment: {
      type: 'POST',
      contentType: 'application/payment',
    },
  },
} as const

type SubscriptionCallback = (event: 'success' | 'error') => void

function sendInvoiceEvent(event: InvoiceEvent, payment: PaymentInfo) {
  if (event.name === 'tip/deposit') {
    return inngest.send({
      name: 'tip/deposit',
      data: {
        ...event.data,
        payment,
      },
    })
  } else {
    return inngest.send({
      name: 'pledge/deposit',
      data: {
        ...event.data,
        payment,
      },
    })
  }
}

export class PaygateService {
  constructor(
    readonly electrumProviderService: ElectrumNetworkProviderService
  ) {}

  readonly subscriptions = new Map<string, SubscriptionCallback>()

  subscribe(invoiceId: string, callback: SubscriptionCallback) {
    this.subscriptions.set(invoiceId, callback)
    return invoiceId
  }

  unsubscribe(invoiceId: string) {
    this.subscriptions.delete(invoiceId)
  }

  async createInvoice(params: {
    network: Network
    address: string
    amount: bigint
    memo?: string | null
    event: InvoiceEvent
  }) {
    return createInvoice(params)
  }

  async getInvoice({ invoiceId }: { invoiceId: string }) {
    return getInvoice({ id: invoiceId })
  }

  async onPayment(
    payment: {
      invoiceId: string
      txId: string
      vout: number
      txHex: string
      amount: string
      address: string
    },
    event: InvoiceEvent
  ) {
    //Log the payment
    logger.info(`Invoice paid: ${payment.invoiceId}`, payment.txId)

    //Save the payment
    await savePayment(payment)

    //Publish to subscribers (SSE)
    Promise.resolve().then(() => {
      try {
        this.subscriptions.get(payment.invoiceId)?.('success')
      } catch (err) {
        logger.error('Failed to publish pledge event', err)
      }
    })

    await sendInvoiceEvent(event, payment)
  }

  async handlePaymentRequest(
    invoiceId: string,
    {
      method,
      headers,
      body,
    }: {
      method: 'GET' | 'POST'
      headers: Headers
      body: ArrayBuffer
    }
  ) {
    const accept = headers.get('accept')
    const contentType = headers.get('content-type')

    const payProVersion = z.coerce
      .number()
      .optional()
      .parse(headers.get('x-paypro-version'))

    const { address, network, amount, memo, event } = await getUnpaidInvoice({
      id: invoiceId,
    })

    const paygateUrl = (process.env.PAYGATE_URL as string).replace(/\/$/, '')

    const paymentRequest = {
      address,
      network,
      amount,
      paymentOptions: {
        memo,
        merchantData: {},
        paymentId: invoiceId,
        paymentUrl: `${paygateUrl}/api/payment-request/pay/${invoiceId}`,
      },
    }

    const onPayment = async (txId: string, vout: number, txHex: string) => {
      await this.onPayment(
        {
          invoiceId,
          txId,
          vout,
          address,
          amount: amount.toString(),
          txHex,
        },
        event
      )
      return 'BCHouse Payment Success'
    }

    if (method === 'GET') {
      const payProVersion = z.coerce
        .number()
        .optional()
        .parse(headers.get('x-paypro-version'))

      if (accept === MediaTypes.BIP70.PaymentRequest.accept) {
        logger.info('bip70 payment request')
        return await bip70.handleBIP70PaymentRequest(
          paymentRequest.address,
          paymentRequest.amount,
          paymentRequest.paymentOptions
        )
      } else if (
        accept === MediaTypes.JPPv1.PaymentRequest.accept &&
        payProVersion !== 2
      ) {
        logger.info('v1 payment request')
        return await jppv1.handleJPPv1PaymentRequest(
          paymentRequest.network,
          paymentRequest.address,
          paymentRequest.amount,
          paymentRequest.paymentOptions
        )
      } else if (
        accept === MediaTypes.JPPv2.PaymentOptions.accept &&
        payProVersion === 2
      ) {
        logger.info('v2 payment options')
        return await jppv2.handleJPPv2PaymentOptions(
          paymentRequest.network,
          paymentRequest.amount,
          paymentRequest.paymentOptions
        )
      }
    } else if (method === 'POST') {
      if (accept === MediaTypes.BIP70.PaymentACK.accept) {
        logger.info('bip70 payment ack')

        return await bip70.handleBIP70PaymentAck(
          this.electrumProviderService,
          paymentRequest.network,
          paymentRequest.address,
          paymentRequest.amount,
          body,
          onPayment
        )
      }
      //JPPv1
      else if (
        contentType === MediaTypes.JPPv1.PaymentVerification.contentType &&
        payProVersion !== 2
      ) {
        logger.info('v1 payment verification')
        return await jppv1.handleJPPv1PaymentVerification(
          paymentRequest.network,
          paymentRequest.address,
          paymentRequest.amount,
          body
        )
      } else if (
        contentType === MediaTypes.JPPv1.Payment.contentType &&
        payProVersion !== 2
      ) {
        logger.info('v1 payment')
        return await jppv1.handleJPPv1Payment(
          this.electrumProviderService,
          paymentRequest.network,
          paymentRequest.address,
          paymentRequest.amount,
          body,
          onPayment
        )
      }
      //JPPv2
      else if (
        contentType === MediaTypes.JPPv2.PaymentRequest.contentType &&
        payProVersion === 2
      ) {
        logger.info('v2 payment request')
        return await jppv2.handleJPPv2PaymentRequest(
          paymentRequest.network,
          paymentRequest.address,
          paymentRequest.amount,
          paymentRequest.paymentOptions
        )
      } else if (
        contentType === MediaTypes.JPPv2.PaymentVerification.contentType &&
        payProVersion === 2
      ) {
        logger.info('v2 payment verification')
        return await jppv2.handleJPPv2PaymentVerification(
          paymentRequest.network,
          paymentRequest.address,
          paymentRequest.amount,
          body
        )
      } else if (
        contentType === MediaTypes.JPPv2.Payment.contentType &&
        payProVersion === 2
      ) {
        logger.info('v2 payment')
        return await jppv2.handleJPPv2Payment(
          this.electrumProviderService,
          paymentRequest.network,
          paymentRequest.address,
          paymentRequest.amount,
          body,
          onPayment
        )
      }
    }

    //Unsupported
    try {
      logger.info(
        'Unsupported payment request',
        JSON.stringify({
          headers: Object.fromEntries(headers.entries()),
        })
      )
    } catch (err) {
      logger.error('Unsupported payment request', err)
    }

    throw new Error('Unsupported payment request')
  }
}
