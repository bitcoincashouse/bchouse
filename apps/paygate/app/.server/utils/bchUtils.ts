//@ts-ignore
import BCHJS from '@psf/bch-js'
import { detectAddressNetwork as _detectAddressNetwork } from 'bchaddrjs'
import { z } from 'zod'
import { logger } from '../../utils/logger'
import { Network } from '../db'

const { Address, Script } = new BCHJS()

export const SATS_PER_BCH = 100000000

export function detectAddressNetwork(address: string): Network | null {
  try {
    const network = _detectAddressNetwork(address)
    return z
      .enum(['mainnet', 'testnet'])
      .transform((val) => (val === 'testnet' ? 'chipnet' : val))
      .parse(network)
  } catch (err) {
    logger.error('Failed to detect address network', err)
    return null
  }
}
export function addressToHash160(address: string) {
  return Address.toHash160(address)
}

export function addressToBytecode(address: string) {
  let addressType: 'p2pkh' | 'p2sh'
  try {
    addressType = z
      .enum(['p2pkh', 'p2sh'])
      .parse(Address.detectAddressType(address))
  } catch (err) {
    logger.error('Error decoding address type:', address, err)
    throw new Error('Invalid address')
  }

  const hash160 = Buffer.from(Address.toHash160(address), 'hex')
  const addressBytecode =
    addressType === 'p2pkh'
      ? Script.pubKeyHash.output.encode(hash160)
      : Script.scriptHash.output.encode(hash160)
  return addressBytecode as Buffer
}
