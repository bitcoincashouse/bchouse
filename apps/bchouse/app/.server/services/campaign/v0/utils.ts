import { Network, addressToBytecode } from '@bchouse/utils'
import { toBufferLE } from 'bigint-buffer'
import { TokenDetails } from 'cashscript'
import { CampaignUtxo } from '../types'

export function getMintingToken({ categoryId }: { categoryId: string }) {
  return {
    amount: BigInt(0),
    category: categoryId,
    nft: {
      capability: 'minting' as const,
      commitment: Buffer.concat([]).toString('hex'),
    },
  } as TokenDetails
}

export function getForwardedPledgeToken({
  categoryId,
  pledgedAmount,
  returnAddress,
  network,
}: {
  categoryId: string
  pledgedAmount: bigint
  returnAddress: string
  network: Network
}) {
  const refundBytecode = addressToBytecode(returnAddress, network)

  return {
    amount: BigInt(0),
    category: categoryId,
    nft: {
      capability: 'none' as const,
      commitment: Buffer.concat([
        toBufferLE(pledgedAmount, 8),
        refundBytecode,
      ]).toString('hex'),
    },
  }
}

export function getCampaignOutput(campaignUtxo: CampaignUtxo) {
  return {
    ...campaignUtxo,
    token: getMintingToken({ categoryId: campaignUtxo.categoryId }),
  }
}
