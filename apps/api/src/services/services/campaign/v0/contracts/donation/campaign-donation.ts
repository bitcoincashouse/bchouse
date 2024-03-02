import { toBufferLE } from 'bigint-buffer'
import {
  Contract,
  NetworkProvider,
  Output,
  SignatureTemplate,
  TokenDetails,
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

    const refundBytecode = addressToBytecode(
      this.params.mainContract.params.payoutAddress
    )
    const commitAmount = BigInt(pledgeUtxo.satoshis) - BigInt(2000)
    const commitmentAmount = toBufferLE(commitAmount, 8)
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
        } as TokenDetails,
      },
      {
        to: this.params.exitContract.contract.tokenAddress,
        amount: BigInt(783),
        token: {
          amount: BigInt(0),
          category: Buffer.from(pledgeUtxo.txid, 'hex').toString('hex'),
          nft: {
            capability: 'none' as const,
            commitment: Buffer.concat([
              commitmentAmount,
              refundBytecode,
            ]).toString('hex'),
          },
        } as TokenDetails,
      },
    ]

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
    const commitAmount = BigInt(pledgeUtxo.satoshis) - BigInt(2000)
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
          categoryId: campaignUtxo.categoryId,
          pledgedAmount: commitAmount,
          //donation's return address is campaign payout address
          returnAddress: this.params.mainContract.params.payoutAddress,
        }),
      },
    ] as Output[]

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
    }
  }
}
