import { Contract, NetworkProvider } from 'cashscript'
import { addressToBytecode, addressToHash160 } from '~/server/utils/bchUtils'
import { CampaignInfo, CampaignUtxo, ContractExecutor } from '../../../types'
import { getMintingToken } from '../../utils'
import mainCampaignContract from './campaign-main.json'

type ContractParams = Omit<CampaignInfo, 'version'> & {
  platformAddress: string
}

export class MainContract extends ContractExecutor<ContractParams> {
  constructor(
    electrumProvider: NetworkProvider,
    contractParams: ContractParams
  ) {
    super(
      MainContract.createContract(electrumProvider, contractParams),
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
    const payoutAddressBytecode = addressToBytecode(
      contractParams.payoutAddress
    )

    const mainContract = new Contract(
      mainCampaignContract,
      [
        platformPkh,
        //TODO: make sure it's BCH Sats
        contractParams.amount,
        BigInt(contractParams.expires),
        //TODO: user's address must be in bytecode format
        payoutAddressBytecode,
      ],
      {
        provider: electrumProvider,
        addressType: 'p2sh20',
      }
    )

    return mainContract
  }

  async complete({ campaignUtxo }: { campaignUtxo: CampaignUtxo }) {
    return await this.contract.functions
      .payout?.()
      .from({
        satoshis: campaignUtxo.satoshis,
        txid: campaignUtxo.txid,
        vout: campaignUtxo.vout,
        token: getMintingToken({ categoryId: campaignUtxo.categoryId }),
      })
      .to([
        {
          amount: campaignUtxo.satoshis - BigInt(1000),
          to: this.params.payoutAddress,
        },
      ])
      .withoutChange()
      .send()
  }
}
