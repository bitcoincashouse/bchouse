import {
  Network,
  addressToBytecode,
  getPrefix,
  logger,
  trimPrefix,
} from '@bchouse/utils'
import {
  decodeTransaction,
  hashTransaction,
  lockingBytecodeToCashAddress,
} from '@bitauth/libauth'
import { z } from 'zod'
import { ElectrumNetworkProviderService } from '../../utils/getElectrumProvider'
import { HandleSuccessFn, PaymentOptions } from './types'
//@ts-ignore
import PaymentProtocol from 'bitcore-payment-protocol'

type ByteBuffer = {
  toArrayBuffer: () => ArrayBuffer
}

const REQUEST_CONTENT_TYPE = 'application/bitcoincash-paymentrequest'
const ACK_CONTENT_TYPE = 'application/bitcoincash-paymentack'

//BIP70
export async function handleBIP70PaymentRequest(
  receiverAddress: string,
  receiverAmount: bigint,
  options: PaymentOptions
) {
  const recieverBytecode = addressToBytecode(receiverAddress)
  const bipOutput = new PaymentProtocol().makeOutput()
  console.log('1')
  bipOutput.set('amount', receiverAmount.toString())
  console.log('2', recieverBytecode)
  bipOutput.set('script', recieverBytecode)
  console.log('3')

  const outputs = [bipOutput.message]
  const time = (Date.now() / 1000) | 0
  const expires = time + 60 * 60 * 24
  const paypro = new PaymentProtocol('BCH')

  const pd = paypro.makePaymentDetails({
    outputs,
    time,
    expires,
    memo: options.memo,
    payment_url: options.paymentUrl,
    merchant_data: JSON.stringify(options.merchantData),
  })

  const pr = paypro.makePaymentRequest({
    payment_details_version: 1,
    serialized_payment_details: pd.serialize(),
  })

  // if (
  //   process.env.NODE_ENV !== 'development' &&
  //   process.env.NODE_ENV !== 'test'
  // ) {
  //   try {
  //     const domainDerPath = process.env.X509_DOMAIN_CERT_DER_PATH as string
  //     const rootDerPath = process.env.X509_ROOT_CERT_DER_PATH as string
  //     const keyPath = process.env.X509_PRIVATE_KEY_PATH as string
  //     const file_with_x509_private_key = fs.readFileSync(keyPath)
  //     const certificates = new PaymentProtocol().makeX509Certificates()
  //     const domainDer = fs.readFileSync(domainDerPath)
  //     const rootDer = fs.readFileSync(rootDerPath)

  //     certificates.set('certificate', [domainDer, rootDer])

  //     const pki_data = certificates.serialize()
  //     paypro.set('payment_details_version', 1)
  //     paypro.set('pki_type', 'x509+sha256')
  //     paypro.set('pki_data', pki_data)
  //     paypro.sign(file_with_x509_private_key)
  //   } catch (error) {
  //     logger.error('paypro.bip70.error', error)
  //   }
  // }

  const payload = pr.serialize() as string | Buffer

  return new Response(payload, {
    headers: {
      'Content-Type': REQUEST_CONTENT_TYPE,
      'Content-Length': payload.length.toString(),
      'Content-Transfer-Encoding': 'binary',
    },
  })
}

export async function handleBIP70PaymentAck(
  electrumProviderService: ElectrumNetworkProviderService,
  network: Network,
  receiverAddress: string,
  startAmount: bigint,
  reqPayload: ArrayBuffer,
  handleSuccess: HandleSuccessFn
) {
  // BIP70 Payment Ack

  const body = PaymentProtocol.Payment.decode(reqPayload) as {
    merchant_data: ByteBuffer
    transactions: [ByteBuffer]
    refund_to: Array<{ amount: any; script: ByteBuffer }>
    memo: string
  }

  const transaction = Buffer.from(body.transactions[0].toArrayBuffer())

  //Libauth mutates the transaction at some point so set txhash now
  const txHex = transaction.toString('hex')
  const decodedTransaction = decodeTransaction(transaction)

  if (typeof decodedTransaction === 'string') {
    throw new Error('Error decoding transaction')
  }

  const outputAddresses = decodedTransaction.outputs.map((output) => {
    //TODO: pass correct prefix (or convert both to legacy)
    const decodedAddress = lockingBytecodeToCashAddress(
      output.lockingBytecode,
      getPrefix(network)
    )

    return {
      amount: output.valueSatoshis,
      address: z.string().parse(decodedAddress),
    }
  })

  const recievedOutput = outputAddresses.find(
    (output) =>
      typeof output.address === 'string' &&
      trimPrefix(output.address) === trimPrefix(receiverAddress)
  )

  if (!recievedOutput) {
    throw new Error(
      'Tranaction failed to send to relevant address: ' + receiverAddress
    )
  }

  if (recievedOutput.amount != BigInt(startAmount)) {
    throw new Error(
      'Tranaction failed to send to correct amount to address: ' +
        receiverAddress
    )
  }

  //Once paid, save the payment
  let txId
  try {
    txId = await electrumProviderService
      .getElectrumProvider(network)
      .sendRawTransaction(txHex)
  } catch (err) {
    logger.error('Failed to broadcast: ', txHex, err)

    const txId = hashTransaction(transaction)
    try {
      await electrumProviderService
        .getElectrumProvider(network)
        .getRawTransaction(txId)
      logger.error('Transaction found in blockchain')
    } catch (_) {
      logger.error(`Transaction not found in blockchain: ${txId}`, _)
      throw err
    }
  }

  if (!txId) {
    throw new Error('Transaction failed to broadcast')
  }

  //TODO: Mark the payment as successful in database.
  //We don't handle wallet failures (like broadcasting when we did not send ACK), original invoice memo contains all fields necessary to refund
  let memo = 'Payment received: ' + txId

  if (handleSuccess) {
    try {
      //If application crashes after broadcast, that is on us though, but same process could apply.
      memo =
        (await handleSuccess?.(
          txId,
          outputAddresses.indexOf(recievedOutput),
          txHex
        )) || memo
    } catch (err) {
      //TODO: try again or refund immediately.
      logger.error('Failed to handle successful payment', err)
      memo = 'Failed to handle successful payment.'
    }
  }

  //Complete BIP70 by sending ACK message
  const payment = new PaymentProtocol().makePayment(body)
  const ack = new PaymentProtocol().makePaymentACK({
    payment: payment.message,
    memo,
  })

  const payload = ack.serialize()

  return new Response(payload, {
    headers: {
      'Content-Type': ACK_CONTENT_TYPE,
      'Content-Length': payload.length.toString(),
      'Content-Transfer-Encoding': 'binary',
    },
  })
}
