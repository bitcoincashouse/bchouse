import { addressToBytecode, addressToHash160 } from '@bchouse/utils'
import {
  Contract,
  NetworkProvider,
  TransactionBuilder,
  Unlocker,
} from 'cashscript'
import {
  AnyonecanpayPledges,
  CampaignInfo,
  CampaignUtxo,
  ContractExecutor,
} from '../../../types'
import { getMintingToken } from '../../utils'
import mainCampaignContract from './contract.json'

type ContractParams = Omit<CampaignInfo, 'version'> & {
  platformAddress: string
}

export class MainContract extends ContractExecutor<ContractParams> {
  constructor(
    private electrumProvider: NetworkProvider,
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

  async complete(
    { campaignUtxo }: { campaignUtxo: CampaignUtxo },
    anyonecanpayPledges: AnyonecanpayPledges = []
  ) {
    const builder = new TransactionBuilder({
      provider: this.electrumProvider,
    })
      .addOutput({
        amount: this.params.amount,
        to: this.params.payoutAddress,
      })
      .addInput(
        {
          satoshis: campaignUtxo.satoshis,
          txid: campaignUtxo.txid,
          vout: campaignUtxo.vout,
          token: getMintingToken({ categoryId: campaignUtxo.categoryId }),
        },
        this.contract.unlock.payout?.() as Unlocker
      )

    for (const pledge of anyonecanpayPledges) {
      builder.addInput(
        {
          satoshis: pledge.satoshis,
          txid: pledge.txid,
          vout: pledge.vout,
        },
        {
          generateLockingBytecode() {
            return Buffer.from(pledge.lockingScript, 'hex')
          },
          generateUnlockingBytecode(options) {
            return Buffer.from(pledge.unlockingScript, 'hex')
          },
        },
        {
          sequence: Number(pledge.seqNum),
        }
      )
    }

    return await builder.send()
  }
}
