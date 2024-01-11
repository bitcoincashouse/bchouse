import {
  Contract,
  NetworkProvider,
  Output,
  SignatureTemplate,
  TransactionBuilder,
  Unlocker,
} from 'cashscript'
import { addressToHash160 } from '~/server/utils/bchUtils'
import {
  CampaignUtxo,
  ContractExecutor,
  ForwardedPledgeUtxo,
} from '../../../types'
import {
  getCampaignOutput,
  getForwardedPledgeToken,
  getMintingToken,
} from '../../utils'
import { MainContract } from '../main/campaign-main'
import exitCampaignContract from './contract.json'

type ContractParams = {
  expires: number
  platformAddress: string
}

export class ExitContract extends ContractExecutor<ContractParams> {
  constructor(
    private readonly electrumProvider: NetworkProvider,
    contractParams: ContractParams
  ) {
    super(
      ExitContract.createContract(electrumProvider, contractParams),
      contractParams
    )
  }

  static createContract(
    electrumProvider: NetworkProvider,
    contractParams: ContractParams
  ) {
    //TODO: create a campaign-start.cash script utxo
    //TODO: might want to derive a unique address per campaign for segregation
    const platformPkh = addressToHash160(contractParams.platformAddress)

    const exitContract = new Contract(
      exitCampaignContract,
      [platformPkh, BigInt(contractParams.expires)],
      {
        provider: electrumProvider,
        addressType: 'p2sh20',
      }
    )

    return exitContract
  }

  async refundBeforeExpiration({
    mainContract,
    campaignUtxo,
    forwardedUtxo,
    returnAddress,
    platformKeys,
  }: {
    mainContract: MainContract
    campaignUtxo: CampaignUtxo
    forwardedUtxo: ForwardedPledgeUtxo
    returnAddress: string
    platformKeys: {
      pubKey: string
      privKey: string
    }
  }) {
    const contractMinusPledge =
      campaignUtxo.satoshis - forwardedUtxo.pledgedAmount

    const nextContractAmount =
      contractMinusPledge <= BigInt(1000) ? BigInt(1000) : contractMinusPledge

    const baseReturnAmount = forwardedUtxo.pledgedAmount - BigInt(2000)

    //Send at least 546 SATS to prevent relay rules error
    const returnAmount =
      baseReturnAmount >= BigInt(546) ? baseReturnAmount : BigInt(546)

    const destination = [
      {
        to: mainContract.contract.tokenAddress,
        amount: nextContractAmount,
        token: getMintingToken({
          categoryId: campaignUtxo.categoryId,
        }),
      },
      //Main contract as 1st output
      {
        to: returnAddress,
        amount: returnAmount,
      },
    ] as Output[]

    const platformPubKey = Buffer.from(platformKeys.pubKey, 'hex')

    const platformPrivKey = new SignatureTemplate(platformKeys.privKey)

    const mainContractPledgeUnlocker =
      mainContract.contract.unlock.refundBeforeExpiration?.(
        platformPubKey,
        platformPrivKey
      ) as Unlocker

    //TODO: Remove keys from here
    const pledgeContractPledgeUnlocker =
      this.contract.unlock.refundBeforeExpiration?.(
        platformPubKey,
        platformPrivKey
      ) as Unlocker

    const pledgeReceiptInput = {
      txid: forwardedUtxo.txid,
      vout: forwardedUtxo.vout,
      satoshis: forwardedUtxo.satoshis,
      token: getForwardedPledgeToken({
        pledgedAmount: forwardedUtxo.pledgedAmount,
        categoryId: campaignUtxo.categoryId,
        returnAddress,
      }),
    }

    const result = await new TransactionBuilder({
      provider: this.electrumProvider,
    })
      .addInput(getCampaignOutput(campaignUtxo), mainContractPledgeUnlocker)
      .addInput(pledgeReceiptInput, pledgeContractPledgeUnlocker)
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
        txid: result.txid,
        satoshis: result.outputs[0].valueSatoshis,
      },
      refundedUtxo: {
        txid: result.txid,
        satoshis: result.outputs[1].valueSatoshis,
      },
    }
  }

  async refundAfterExpiration({
    mainContract,
    campaignUtxo,
    forwardedUtxo,
    returnAddress,
  }: {
    returnAddress: string
    mainContract: MainContract
    campaignUtxo: CampaignUtxo
    forwardedUtxo: ForwardedPledgeUtxo
  }) {
    const contractMinusPledge =
      campaignUtxo.satoshis - forwardedUtxo.pledgedAmount

    const nextContractAmount =
      contractMinusPledge <= BigInt(1000) ? BigInt(1000) : contractMinusPledge

    const baseReturnAmount = forwardedUtxo.pledgedAmount - BigInt(2000)
    //Send at least 546 SATS to prevent relay rules error
    const returnAmount =
      baseReturnAmount >= BigInt(546) ? baseReturnAmount : BigInt(546)

    const destination = [
      {
        to: mainContract.contract.tokenAddress,
        amount: nextContractAmount,
        token: getMintingToken({
          categoryId: campaignUtxo.categoryId,
        }),
      },
      //Main contract as 1st output
      {
        to: returnAddress,
        amount: returnAmount,
      },
    ] as Output[]

    const mainContractPledgeUnlocker =
      mainContract.contract.unlock.refundAfterExpiration?.() as Unlocker

    //TODO: Remove keys from here
    const pledgeContractPledgeUnlocker =
      this.contract.unlock.refundAfterExpiration?.() as Unlocker

    const pledgeReceiptInput = {
      txid: forwardedUtxo.txid,
      vout: forwardedUtxo.vout,
      satoshis: forwardedUtxo.satoshis,
      token: getForwardedPledgeToken({
        pledgedAmount: forwardedUtxo.pledgedAmount,
        categoryId: campaignUtxo.categoryId,
        returnAddress,
      }),
    }

    const result = await new TransactionBuilder({
      provider: this.electrumProvider,
    })
      .addInput(getCampaignOutput(campaignUtxo), mainContractPledgeUnlocker)
      .addInput(pledgeReceiptInput, pledgeContractPledgeUnlocker)
      .addOutputs(destination)
      .setLocktime(this.params.expires)
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
        txid: result.txid,
        satoshis: result.outputs[0].valueSatoshis,
      },
      refundedUtxo: {
        txid: result.txid,
        satoshis: result.outputs[1].valueSatoshis,
      },
    }
  }
}
