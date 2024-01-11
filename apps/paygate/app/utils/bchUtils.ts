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
