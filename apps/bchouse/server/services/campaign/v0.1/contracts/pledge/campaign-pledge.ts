import {
  Contract,
  NetworkProvider,
  Output,
  SignatureTemplate,
  TransactionBuilder,
  Unlocker,
} from 'cashscript'
import { addressToBytecode } from '~/server/utils/bchUtils'
import { CampaignUtxo, ContractExecutor, PledgeUtxo } from '../../../types'
import {
  getCampaignOutput,
  getForwardedPledgeToken,
  getMintingToken,
} from '../../utils'
import { ExitContract } from '../exit/campaign-exit'
import { MainContract } from '../main/campaign-main'
import pledgeCampaignContract from './contract.json'

type ContractParams = {
  exitContract: ExitContract
  categoryId: string
  contributorRefundAddress: string
}

export class PledgeContract extends ContractExecutor<ContractParams> {
  constructor(
    private readonly electrumProvider: NetworkProvider,
    contractParams: ContractParams
  ) {
    super(
      PledgeContract.createContract(electrumProvider, contractParams),
      contractParams
    )
  }

  static createContract(
    electrumProvider: NetworkProvider,
    contractParams: ContractParams
  ) {
    const categoryBytecode = Buffer.from(contractParams.categoryId, 'hex')
      .reverse()
      .toString('hex')
    const pledgerRefundBytecode = addressToBytecode(
      contractParams.contributorRefundAddress
    )
    const exitContractAddressBytecode = addressToBytecode(
      contractParams.exitContract.contract.address
    )
    const pledgeContract = new Contract(
      pledgeCampaignContract,
      [pledgerRefundBytecode, categoryBytecode, exitContractAddressBytecode],
      {
        provider: electrumProvider,
        addressType: 'p2sh20',
      }
    )

    return pledgeContract
  }

  async forwardToCampaign({
    mainContract,
    campaignUtxo,
    pledgeUtxo,
    platformKeys,
  }: {
    mainContract: MainContract
    campaignUtxo: CampaignUtxo
    pledgeUtxo: PledgeUtxo
    platformKeys: {
      pubKey: string
      privKey: string
    }
  }) {
    const maxAmount = mainContract.params.amount + 2000n
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
      //Main contract as 0th output
      {
        to: mainContract.contract.tokenAddress,
        amount: newTotal,
        token: getMintingToken({
          categoryId: campaignUtxo.categoryId,
        }),
      },
      //Main contract as 1st output
      {
        to: this.params.exitContract.contract.tokenAddress,
        amount: BigInt(783),
        token: getForwardedPledgeToken({
          isDonation: false,
          categoryId: campaignUtxo.categoryId,
          pledgedAmount: commitAmount,
          returnAddress: this.params.contributorRefundAddress,
        }),
      },
    ] as Output[]

    if (change) {
      destination.push({
        amount: change,
        to: this.params.contributorRefundAddress,
      })
    }

    const platformPubKey = Buffer.from(platformKeys.pubKey, 'hex')

    const platformPrivKey = new SignatureTemplate(platformKeys.privKey)

    const mainContractPledgeUnlocker = mainContract.contract.unlock.pledge?.(
      platformPubKey,
      platformPrivKey
    ) as Unlocker

    const pledgeContractPledgeUnlocker =
      this.contract.unlock.pledge?.() as Unlocker

    const result = await new TransactionBuilder({
      provider: this.electrumProvider,
    })
      //Main contract as 0th input
      .addInput(getCampaignOutput(campaignUtxo), mainContractPledgeUnlocker)
      //Pledge contract as 1st input
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

  async cancelContract({ pledgeUtxo }: { pledgeUtxo: PledgeUtxo }) {
    const result = await this.contract.functions
      .cancel?.()
      .to(
        this.params.contributorRefundAddress,
        pledgeUtxo.satoshis - BigInt(600)
      )
      .from({
        satoshis: pledgeUtxo.satoshis,
        txid: pledgeUtxo.txid,
        vout: pledgeUtxo.vout,
      })
      .send()

    if (!result) {
      throw new Error('Failed to broadcast cancel contract')
    }

    return {
      refundedUtxo: {
        txid: result.txid,
        vout: 0,
      },
    }
  }
}
