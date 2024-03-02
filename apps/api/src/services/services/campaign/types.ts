import type { TransactionDetails } from 'cashscript'
import { Contract } from 'cashscript'
import type { Network, PledgeType } from '~/services/db'

export type { Network, PledgeType }
export type CampaignInfo = {
  payoutAddress: string
  amount: bigint
  expires: number
  network: Network
  version: number
}

export type AnyonecanpayPledges = {
  satoshis: bigint
  txid: string
  vout: number
  seqNum: bigint
  lockingScript: string
  unlockingScript: string
}[]

export type CampaignUtxo = {
  txid: string
  vout: number
  satoshis: bigint
  categoryId: string
}

export type PledgeUtxo = {
  txid: string
  vout: number
  satoshis: bigint
}

export type ForwardedPledgeUtxo = {
  txid: string
  vout: number
  satoshis: bigint
  pledgedAmount: bigint
}

export abstract class ContractExecutor<ContractParams> {
  constructor(readonly contract: Contract, readonly params: ContractParams) {}
}

export abstract class AbstractCampaignContract {
  abstract getDonationAddress(): string

  abstract getPledgeAddress(
    refundAddress: string,
    pledgeType: PledgeType,
    categoryId?: string
  ): string

  abstract complete(
    campaignUtxo?: CampaignUtxo | null,
    anyonecanpayPledges?: AnyonecanpayPledges
  ): Promise<TransactionDetails | undefined>

  abstract forwardPledge(
    pledgeId: string,
    refundAddress: string,
    pledgeType: PledgeType,
    pledgeUtxo: PledgeUtxo,
    campaignUtxo?: CampaignUtxo | null,
    onForwardPledge?: (pledgeUtxo: PledgeUtxo) => Promise<void>
  ): Promise<{
    campaignUtxo: {
      categoryId: string
      txid: string
      satoshis: bigint
    }
    forwardedPledge: {
      txid: string
      satoshis: bigint
    }
  }>

  abstract cancelPledge(
    pledgeId: string,
    refundAddress: string,
    pledgeType: PledgeType,
    pledgeUtxo: PledgeUtxo,
    forwardedUtxo?: ForwardedPledgeUtxo | null,
    campaignUtxo?: CampaignUtxo | null
  ): Promise<
    | {
        campaignUtxo: { txid: string; satoshis: bigint }
        refundedUtxo: { txid: string; satoshis: bigint }
      }
    | {
        refundedUtxo: { txid: string; vout: number }
      }
  >

  abstract refundAfterExpiration(
    refundAddress: string,
    forwardedUtxo: ForwardedPledgeUtxo,
    campaignUtxo: CampaignUtxo
  ): Promise<{
    campaignUtxo: { txid: string; satoshis: bigint }
    refundedUtxo: { txid: string; satoshis: bigint }
  }>
}

// export abstract class CampaignContract {
//   abstract getStartCampaignPledgeAddress(): string
//   abstract getCampaignDonationAddress(): string
//   abstract getStartedCampaignPledgeAddress(): string
//   abstract forwardPledgeContract(): string

//   abstract forwardPledgeContract(): string

//   abstract forwardStartContract(): string
//   abstract forwardStartContractToGenesis(): string
//   abstract forwardStartContractToNewCampaign(): string

//   abstract forwardDonationContract(): string
//   abstract forwardDonationContractToGenesis(): string
//   abstract forwardDonationContractToNewCampaign(): string

//   abstract cancelStartContract(): string
//   abstract refundBeforeExpiration(): string
//   abstract refundAfterExpiration(): string
//   abstract complete(): string
// }
