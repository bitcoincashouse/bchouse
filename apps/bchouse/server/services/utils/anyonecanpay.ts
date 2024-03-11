import { logger } from '@bchouse/utils'
import {
  ConsensusCommon,
  TransactionBCH,
  cashAddressToLockingBytecode,
  decodeAuthenticationInstructions,
  decodeBitcoinSignature,
  generateSigningSerializationBCH,
  hash256,
  lockingBytecodeToCashAddress,
  secp256k1,
  sha256,
} from '@bitauth/libauth'
import { z } from 'zod'

function varInt(number: number) {
  // Declare storage for the results.
  let result

  // If the number should be encoded in 1 byte..
  if (number < 0xfd) {
    result = Buffer.alloc(1)
    result.writeUInt8(number)
  }
  // If the number should be encoded in 3 bytes..
  else if (number < 0xffff) {
    result = Buffer.alloc(3)
    result.writeUInt8(0xfd)
    result.writeUInt16LE(number, 1)
  }
  // If the number should be encoded in 5 bytes..
  else if (number < 0xffffffff) {
    result = Buffer.alloc(5)
    result.writeUInt8(0xfe)
    result.writeUInt32LE(number, 1)
  }
  // If the number should be encoded in 9 bytes..
  else {
    result = Buffer.alloc(9)
    result.writeUInt8(0xff)
    result.writeBigUInt64LE(BigInt(number), 1)
  }

  // Return the variable integer buffer.
  return result
}

function varBuf(input: Buffer | Uint8Array) {
  let prependLength = varInt(input.length)
  let result = Buffer.concat([prependLength, input])

  // Return the variable buffer encoded data.
  return result
}

interface Outpoint {
  value: Uint8Array
  locking_script: Uint8Array
}

function getScriptHash(script: string) {
  const hash = Buffer.from(sha256.hash(Buffer.from(script)))
  return hash.reverse().toString('hex')
}

type Recipient = {
  address: string
  satoshis: number
}

interface ValidatedCommitment {
  txHash: string
  txIndex: number
  satoshis: number
  seqNum: number
  unlockingScript: string
  lockingScript: string
}

function validCommitmentSignature(
  recipients: Recipient[],
  {
    txHash,
    lockingScript,
    unlockingScript,
    txIndex,
    satoshis,
  }: ValidatedCommitment
) {
  try {
    const outputs = recipients.map(({ address, satoshis }) => {
      const lockingBytecode = cashAddressToLockingBytecode(address)
      if (typeof lockingBytecode === 'string') throw ''

      return {
        lockingBytecode: lockingBytecode.bytecode,
        valueSatoshis: BigInt(satoshis),
      }
    })

    const previousTransactionUnlockScript = Buffer.from(unlockingScript, 'hex')

    const verificationMessage = generateSigningSerializationBCH(
      {
        //Single input verification since anyonecanpay
        inputIndex: 0,
        sourceOutputs: [
          {
            lockingBytecode: Buffer.from(lockingScript, 'hex'),
            valueSatoshis: BigInt(satoshis),
          },
        ],
        transaction: {
          inputs: [
            {
              outpointIndex: txIndex,
              outpointTransactionHash: Buffer.from(txHash, 'hex').reverse(),
              sequenceNumber: 0xffffffff,
              unlockingBytecode: previousTransactionUnlockScript,
            },
          ],
          outputs: outputs,
          locktime: 0,
          version: 2,
        },
      },
      {
        coveredBytecode: Buffer.from(lockingScript, 'hex'),
        signingSerializationType: Buffer.from('c1', 'hex'),
      }
    )

    const sighashDigest = hash256(verificationMessage)

    const decoded = decodeAuthenticationInstructions(
      previousTransactionUnlockScript
    )

    const [{ data: encodedSignature }, { data: publicKey }] = z
      .tuple([
        z.object({
          data: z.custom((data) => data instanceof Buffer),
        }),
        z.object({
          data: z.custom((data) => data instanceof Buffer),
        }),
      ])
      .parse(decoded)

    const { signature } = decodeBitcoinSignature(encodedSignature)

    const useSchnorr =
      signature.length === ConsensusCommon.schnorrSignatureLength

    if (typeof signature === 'string') {
      throw ''
    }

    const success = useSchnorr
      ? secp256k1.verifySignatureSchnorr(signature, publicKey, sighashDigest)
      : secp256k1.verifySignatureDER(signature, publicKey, sighashDigest)

    return success
  } catch (err) {
    logger.error('Error validating signature', err)
    return false
  }
}

export function parseCommitmentFromElectronCash(base64text: string) {
  // Attempt to decode the base64 contribution.
  const commitmentObject = z
    .object({
      inputs: z.array(
        z.object({
          previous_output_transaction_hash: z.string(),
          previous_output_index: z.coerce.number(),
          sequence_number: z.coerce.number(),
          unlocking_script: z.string(),
        })
      ),
      data: z
        .object({
          comment: z.string().optional(),
          alias: z.string().optional(),
        })
        .optional(),
    })
    .parse(JSON.parse(Buffer.from(base64text, 'base64').toString('utf8')))

  const input = commitmentObject.inputs[0]
  if (!input) {
    throw new Error('')
  }

  const {
    previous_output_transaction_hash: txHash,
    previous_output_index: txIndex,
    sequence_number: seqNum,
    unlocking_script: unlockingScript,
  } = input

  return {
    txHash,
    txIndex,
    seqNum,
    unlockingScript,
    comment: commitmentObject.data?.comment,
    name: commitmentObject.data?.alias,
  }
}

export function validateContribution(
  commitment: ValidatedCommitment,
  recipients: Recipient[]
) {
  if (!recipients || !recipients.length) {
    throw 'Cannot validate contribution without recipients!'
  }

  const isValid = validCommitmentSignature(recipients, commitment)
  return isValid
}

function contributionFromTransaction(
  transaction: TransactionBCH,
  txIndex: number
) {
  const vout = transaction.outputs[txIndex]

  if (!vout || !vout.lockingBytecode) throw new Error('')

  const lockingScriptBuf = Buffer.from(vout.lockingBytecode)
  const lockingScript = lockingScriptBuf.toString('hex')
  const address = lockingBytecodeToCashAddress(lockingScriptBuf)

  if (typeof address === 'string') {
    throw new Error('Invalid locking script')
  }

  return {
    lockingScript,
    address: address,
    scriptHash: getScriptHash(lockingScript),
    satoshis: vout.valueSatoshis,
    seqNum: 0xffffffff,
  }
}
