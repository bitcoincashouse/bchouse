import { decodeCashAddressFormat } from '@bitauth/libauth'
import { z } from 'zod'
import { logger } from './logger'
export const SATS_PER_BCH = 100000000
export const MIN_SATOSHIS = 546
export const MAX_SATOSHIS = 100000000000

export type Network =
  | 'mainnet'
  | 'chipnet'
  | 'testnet3'
  | 'testnet4'
  | 'regtest'

export type AddressPrefixType = 'mainnet' | 'testnet'

export function getPrefix(network: Network) {
  return network === 'mainnet'
    ? 'bitcoincash'
    : network === 'regtest'
    ? 'bchreg'
    : 'bchtest'
}

export function trimPrefix(address: string) {
  return address.replace(/^bitcoincash:|bchtest:|bchreg:/, '')
}

export function formatAddress(network: Network, address: string) {
  return getPrefix(network) + ':' + trimPrefix(address)
}

export function detectAddressNetwork(address: string): Network | null {
  try {
    const decodedAddress = decodeCashAddressFormat(address)

    if (typeof decodedAddress === 'string') {
      throw new Error(decodedAddress)
    }

    return z
      .enum(['bitcoincash', 'bchtest', 'bchreg'])
      .transform((val) => (val === 'bitcoincash' ? 'mainnet' : 'chipnet'))
      .parse(decodedAddress.prefix)
  } catch (err) {
    logger.error('Failed to detect address network', err)
    return null
  }
}

export function addressToHash160(address: string) {
  // const addressBytecode = cashAddressToLockingBytecode(address)
  // if (typeof addressBytecode === 'string') {
  //   throw new Error('Invalid address')
  // }
  // const addrContent = lockingBytecodeToAddressContents(addressBytecode.bytecode)
  // if (typeof addrContent === 'string') {
  //   throw new Error('Invalid address bytecode')
  // }
  // return binToHex(addrContent.payload)
}

export function isStandardCashAddress(bytecode: Buffer | Uint8Array) {
  // return isPayToPublicKeyHash(bytecode) || isPayToScriptHash20(bytecode)
}

export function addressToBytecode(address: string) {
  // const addressBytecode = cashAddressToLockingBytecode(address)
  // if (typeof addressBytecode === 'string') {
  //   throw new Error('Invalid address')
  // }
  // if (!isStandardCashAddress(addressBytecode.bytecode)) {
  //   throw new Error('Non-standard address')
  // }
  // return addressBytecode.bytecode
}
