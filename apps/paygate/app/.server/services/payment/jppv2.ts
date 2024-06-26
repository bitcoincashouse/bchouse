import { Network, getPrefix, logger, moment, trimPrefix } from '@bchouse/utils'
import {
  decodeTransaction,
  hashTransaction,
  lockingBytecodeToCashAddress,
} from '@bitauth/libauth'
import { z } from 'zod'
import type * as JPPv2 from '../../types/jppv2'
import { ElectrumNetworkProviderService } from '../../utils/getElectrumProvider'
import { HandleSuccessFn, PaymentOptions } from './types'
import { buildJppHeader } from './utils'

//JPPv2
export async function handleJPPv2PaymentOptions(
  network: Network,
  amount: bigint,
  options: PaymentOptions
) {
  if (network !== 'mainnet') {
    throw new Error('non-mainnet networks not supported')
  }

  const response = {
    paymentOptions: [
      {
        chain: 'BCH',
        currency: 'BCH',
        decimals: 8,
        estimatedAmount: Number(amount),
        network: 'mainnet',
        requiredFeeRate: 1,
        minerFee: 0,
        selected: true,
      },
    ],
    time: moment().toDate(),
    expires: moment().add(15, 'minute').toDate(),
    memo: options.memo,
    paymentUrl: options.paymentUrl,
    paymentId: options.paymentId,
  } as JPPv2.PaymentProtoOptionsResponse

  const responseStr = JSON.stringify(response)

  return new Response(responseStr, {
    status: 200,
    headers: buildJppHeader(responseStr),
  })
}

export async function handleJPPv2PaymentRequest(
  network: Network,
  receiverAddress: string,
  receiverAmount: bigint,
  options: PaymentOptions
) {
  if (network !== 'mainnet') {
    throw new Error('non-mainnet networks not supported')
  }

  const response = {
    network: 'main',
    chain: 'BCH',
    currency: 'BCH',
    requiredFeePerByte: 0,
    instructions: [
      {
        type: 'transaction',
        requiredFeeRate: 1,
        outputs: [
          {
            address: receiverAddress,
            amount: Number(receiverAmount),
          },
        ],
      },
    ],
    time: moment().toDate(),
    expires: moment().add(15, 'minute').toDate(),
    memo: options.memo,
    paymentUrl: options.paymentUrl,
    paymentId: options.paymentId,
  } as JPPv2.PaymentRequestResponse

  const responseStr = JSON.stringify(response)

  return new Response(responseStr, {
    status: 200,
    headers: buildJppHeader(responseStr),
  })
}

export async function handleJPPv2PaymentVerification(
  network: Network,
  receiverAddress: string,
  startAmount: bigint,
  reqPayload: ArrayBuffer
) {
  const reqPayloadStr = Buffer.from(reqPayload).toString('utf8')
  const body = z
    .object({
      currency: z.string(),
      transactions: z.array(z.object({ tx: z.string() })),
    })
    .parse(JSON.parse(reqPayloadStr))

  if (body.currency !== 'BCH') {
    throw new Error('Unsupported currency: ' + body.currency)
  }

  if (body.transactions.length > 1) {
    throw new Error('Too many transaction')
  }

  const unsignedTransaction = body.transactions[0]?.tx as string

  const decodedTransaction = decodeTransaction(
    Buffer.from(unsignedTransaction, 'hex')
  )

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

  const responseBody = {
    payment: body,
    memo: 'Valid transaction',
  }

  const responseStr = JSON.stringify(responseBody)

  return new Response(responseStr, {
    status: 200,
    headers: buildJppHeader(responseStr),
  })
}

export async function handleJPPv2Payment(
  electrumProviderService: ElectrumNetworkProviderService,
  network: Network,
  receiverAddress: string,
  startAmount: bigint,
  reqPayload: ArrayBuffer,
  handleSuccess: HandleSuccessFn
) {
  const body = z
    .object({
      currency: z.string(),
      transactions: z.array(z.object({ tx: z.string() })),
    })
    .parse(JSON.parse(Buffer.from(reqPayload).toString('utf8')))

  if (body.currency !== 'BCH') {
    throw new Error('Unsupported currency: ' + body.currency)
  }

  if (body.transactions.length > 1) {
    throw new Error('Too many transactions')
  }

  const transaction = Buffer.from(body.transactions[0]?.tx as string)
  const txHex = body.transactions[0]?.tx as string
  const decodedTransaction = decodeTransaction(
    Buffer.from(body.transactions[0]?.tx as string, 'hex')
  )

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
      memo = await handleSuccess?.(
        txId,
        outputAddresses.indexOf(recievedOutput),
        txHex
      )
    } catch (err) {
      //TODO: try again or refund immediately.
      logger.error('Failed to handle successful payment', err)
      memo = 'Failed to handle successful payment.'
    }
  }

  return new Response(JSON.stringify(body))
}
