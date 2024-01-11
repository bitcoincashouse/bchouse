import { SATS_PER_BCH } from './bchUtils'

export function prettyPrintSats(
  sats: number,
  denomination: 'BCH' | 'SATS' = 'BCH'
): [string | number, 'BCH' | 'SATS'] {
  if (isNaN(sats)) return [0, denomination]

  sats = Math.round(sats)
  if (denomination === 'SATS') return [sats, denomination]
  if (denomination === 'BCH') {
    const bch = Number((sats / SATS_PER_BCH).toFixed(8))
    const readableBch = bch.toLocaleString()

    if (readableBch === '0') {
      return [sats, 'SATS']
    } else {
      return [readableBch, 'BCH']
    }
  }

  throw new Error('Invalid')
}
