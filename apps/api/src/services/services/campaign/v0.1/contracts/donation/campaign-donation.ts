import {
  Contract,
  NetworkProvider,
  Output,
  Recipient,
  SignatureTemplate,
  TransactionBuilder,
  Unlocker,
} from 'cashscript'
import { addressToBytecode } from '~/services/utils/bchUtils'
import { CampaignUtxo, ContractExecutor, PledgeUtxo } from '../../../types'
import {
  getCampaignOutput,
  getForwardedPledgeToken,
  getMintingToken,
} from '../../utils'
import { ExitContract } from '../exit/campaign-exit'
import { MainContract } from '../main/campaign-main'
import donationCampaignContract from './contract.json'

type ContractParams = {
  mainContract: MainContract
  exitContract: ExitContract
}

export class DonationContract extends ContractExecutor<ContractParams> {
  constructor(
    private readonly electrumProvider: NetworkProvider,
    contractParams: ContractParams
  ) {
    super(
      DonationContract.createContract(electrumProvider, contractParams),
      contractParams
    )
  }

  static createContract(
    electrumProvider: NetworkProvider,
    contractParams: ContractParams
  ): Contract {
    //TODO: payout address doesn't necessarily == initial funding return address
    const initialRefundBytecode = addressToBytecode(
      contractParams.mainContract.params.payoutAddress
    )
    const mainContractAddressBytecode = addressToBytecode(
      contractParams.mainContract.contract.address
    )
    const exitContractAddressBytecode = addressToBytecode(
      contractParams.exitContract.contract.address
    )

    const donationContract = new Contract(
      donationCampaignContract,
      [
        contractParams.mainContract.params.amount,
        initialRefundBytecode,
        mainContractAddressBytecode,
        exitContractAddressBytecode,
      ],
      {
        provider: electrumProvider,
        addressType: 'p2sh20',
      }
    )

    return donationContract
  }

  async forwardToGenesis({ pledgeUtxo }: { pledgeUtxo: PledgeUtxo }) {
    const newValue = BigInt(pledgeUtxo.satoshis) - BigInt(1000)

    const result = await this.contract.functions
      .forward?.()
      .to(this.contract.address, newValue)
      .from({
        txid: pledgeUtxo.txid,
        vout: pledgeUtxo.vout,
        satoshis: pledgeUtxo.satoshis,
      })
      .withoutChange()
      .send()

    if (!result) throw new Error('Failed to forward')

    if (!result.outputs[0]) {
      throw new Error('Missing campaign output')
    }

    return {
      pledgeUtxo: {
        vout: 0,
        txid: result.txid,
        satoshis: result.outputs[0].valueSatoshis,
      },
    }
  }

  async forwardToNewCampaign({ pledgeUtxo }: { pledgeUtxo: PledgeUtxo }) {
    if (pledgeUtxo.vout !== 0) {
      throw new Error('Invalid utxo to create campaign contract')
    }

    const maxPledgableAmount = this.params.mainContract.params.amount + 2000n

    if (maxPledgableAmount <= 0n) {
      throw new Error('Campaign is already completable')
    }

    const maxUserPledgableAmount = pledgeUtxo.satoshis - 2000n
    const commitAmount =
      maxUserPledgableAmount <= maxPledgableAmount
        ? //All users funds can be pledge
          maxUserPledgableAmount
        : //Only maxPledgeAmount can be pledged
          maxPledgableAmount

    const change =
      commitAmount === maxUserPledgableAmount
        ? //If full user is sending whole utxo, then no change
          null
        : //Otherwise change is pledge utxo minus fee (maxUserPledgableAmount) minus what's committed
          maxUserPledgableAmount - commitAmount

    if ((change || 0n) + commitAmount + 2000n !== pledgeUtxo.satoshis) {
      throw new Error('Change miscalculation')
    }

    const destination = [
      {
        to: this.params.mainContract.contract.tokenAddress,
        amount: commitAmount,
        token: {
          amount: BigInt(0),
          category: Buffer.from(pledgeUtxo.txid, 'hex').toString('hex'),
          nft: {
            capability: 'minting' as const,
            commitment: Buffer.concat([]).toString('hex'),
          },
        },
      },
      {
        to: this.params.exitContract.contract.tokenAddress,
        amount: BigInt(783),
        token: getForwardedPledgeToken({
          isDonation: true,
          categoryId: pledgeUtxo.txid,
          pledgedAmount: commitAmount,
          returnAddress: this.params.mainContract.params.payoutAddress,
        }),
      },
    ] as Recipient[]

    if (change) {
      destination.push({
        amount: change,
        to: this.params.mainContract.params.payoutAddress,
      })
    }

    const result = await this.contract.functions
      .create?.()
      .to(destination)
      .from({
        txid: pledgeUtxo.txid,
        vout: pledgeUtxo.vout,
        satoshis: pledgeUtxo.satoshis,
      })
      .withoutChange()
      .send()

    if (!result) {
      throw new Error('Failed to broadcast campaign create contract')
    }

    if (!result.outputs[0]) {
      throw new Error('Missing campaign output')
    }

    if (!result.outputs[1]) {
      throw new Error('Missing pledge output')
    }

    return {
      campaignUtxo: {
        categoryId: pledgeUtxo.txid,
        txid: result.txid,
        satoshis: result.outputs[0].valueSatoshis,
      },
      forwardedPledge: {
        txid: result.txid,
        satoshis: result.outputs[1].valueSatoshis,
      },
      change: result.outputs[2]
        ? {
            txid: result.txid,
            satoshis: result.outputs[2].valueSatoshis,
          }
        : undefined,
    }
  }

  async forwardToCampaign({
    campaignUtxo,
    pledgeUtxo,
    platformKeys,
  }: {
    campaignUtxo: CampaignUtxo
    pledgeUtxo: PledgeUtxo
    platformKeys: {
      pubKey: string
      privKey: string
    }
  }) {
    const maxAmount = this.params.mainContract.params.amount + 2000n
    const maxPledgableAmount = maxAmount - campaignUtxo.satoshis

    if (maxPledgableAmount <= 0n) {
      throw new Error('Campaign is already completable')
    }

    const maxUserPledgableAmount = pledgeUtxo.satoshis - 2000n
    const commitAmount =
      maxUserPledgableAmount <= maxPledgableAmount
        ? //All users funds can be pledge
          maxUserPledgableAmount
        : //Only maxPledgeAmount can be pledged
          maxPledgableAmount

    const change =
      commitAmount === maxUserPledgableAmount
        ? //If full user is sending whole utxo, then no change
          null
        : //Otherwise change is pledge utxo minus fee (maxUserPledgableAmount) minus what's committed
          maxUserPledgableAmount - commitAmount

    if ((change || 0n) + commitAmount + 2000n !== pledgeUtxo.satoshis) {
      throw new Error('Change miscalculation')
    }

    const newTotal = BigInt(commitAmount) + BigInt(campaignUtxo.satoshis)
    const destination = [
      {
        to: this.params.mainContract.contract.tokenAddress,
        amount: newTotal,
        token: getMintingToken({ categoryId: campaignUtxo.categoryId }),
      },
      {
        to: this.params.exitContract.contract.tokenAddress,
        amount: BigInt(783),
        token: getForwardedPledgeToken({
          isDonation: true,
          categoryId: campaignUtxo.categoryId,
          returnAddress: this.params.mainContract.params.payoutAddress,
          pledgedAmount: commitAmount,
        }),
      },
    ] as Output[]

    if (change) {
      destination.push({
        amount: change,
        to: this.params.mainContract.params.payoutAddress,
      })
    }

    const platformPubKey = Buffer.from(platformKeys.pubKey, 'hex')

    const platformPrivKey = new SignatureTemplate(platformKeys.privKey)

    const mainContractPledgeUnlocker =
      this.params.mainContract.contract.unlock.pledge?.(
        platformPubKey,
        platformPrivKey
      ) as Unlocker

    const pledgeContractPledgeUnlocker =
      this.contract.unlock.pledge?.() as Unlocker

    const result = await new TransactionBuilder({
      provider: this.electrumProvider,
    })
      .addInput(getCampaignOutput(campaignUtxo), mainContractPledgeUnlocker)
      .addInput(pledgeUtxo, pledgeContractPledgeUnlocker)
      .addOutputs(destination)
      .send()

    if (!result) {
      throw new Error('Failed to broadcast campaign create contract')
    }

    if (!result.outputs[0]) {
      throw new Error('Missing campaign output')
    }

    if (!result.outputs[1]) {
      throw new Error('Missing pledge output')
    }

    return {
      campaignUtxo: {
        categoryId: campaignUtxo.categoryId,
        txid: result.txid,
        satoshis: result.outputs[0].valueSatoshis,
      },
      forwardedPledge: {
        txid: result.txid,
        satoshis: result.outputs[1].valueSatoshis,
      },
      change: result.outputs[2]
        ? {
            txid: result.txid,
            satoshis: result.outputs[2].valueSatoshis,
          }
        : undefined,
    }
  }
}
