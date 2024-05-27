import { NetworkProvider } from 'cashscript'
import { appEnv } from '~/.server/appEnv'
import {
  AnyonecanpayPledges,
  CampaignInfo,
  CampaignUtxo,
  ForwardedPledgeUtxo,
  PledgeUtxo,
} from '../types'
import { DonationContract } from './contracts/donation/campaign-donation'
import { ExitContract } from './contracts/exit/campaign-exit'
import { MainContract } from './contracts/main/campaign-main'
import { PledgeContract } from './contracts/pledge/campaign-pledge'
import { StartContract } from './contracts/start/campaign-start'

export class CampaignContractApi {
  private readonly mainContract: MainContract
  private readonly exitContract: ExitContract

  constructor(
    private readonly electrumProvider: NetworkProvider,
    private readonly campaignInfo: CampaignInfo
  ) {
    this.mainContract = new MainContract(electrumProvider, {
      amount: campaignInfo.amount,
      expires: campaignInfo.expires,
      payoutAddress: campaignInfo.payoutAddress,
      network: campaignInfo.network,
      platformAddress: appEnv.FLIPSTARTER_PLATFORM_ADDRESS as string,
    })

    this.exitContract = new ExitContract(electrumProvider, {
      expires: campaignInfo.expires,
      platformAddress: appEnv.FLIPSTARTER_PLATFORM_ADDRESS as string,
    })
  }

  withPledgeFrom(refundAddress: string) {
    return new CampaignContractWithPledgeInfo(
      this.electrumProvider,
      this.mainContract,
      this.exitContract,
      this.campaignInfo,
      refundAddress
    )
  }

  withCategoryId(categoryId: string) {
    return new CampaignContractWithCategoryId(
      this.mainContract,
      this.campaignInfo,
      categoryId
    )
  }
}

class CampaignContractWithCategoryId {
  constructor(
    private readonly mainContract: MainContract,
    private readonly campaignInfo: CampaignInfo,
    private readonly categoryId: string
  ) {}

  async complete(
    { campaignUtxo }: { campaignUtxo: CampaignUtxo },
    anyonecanpayPledges: AnyonecanpayPledges
  ) {
    return this.mainContract.complete(
      {
        campaignUtxo,
      },
      anyonecanpayPledges
    )
  }
}

class CampaignContractWithPledgeInfo {
  private readonly startContract: StartContract
  private readonly donationContract: DonationContract

  constructor(
    private readonly electrumProvider: NetworkProvider,
    private readonly mainContract: MainContract,
    private readonly exitContract: ExitContract,
    private readonly campaignInfo: CampaignInfo,
    readonly refundAddress: string
  ) {
    this.refundAddress = refundAddress
    this.startContract = new StartContract(electrumProvider, {
      returnAddress: refundAddress,
      exitContract: exitContract,
      mainContract: mainContract,
    })

    this.donationContract = new DonationContract(electrumProvider, {
      exitContract: exitContract,
      mainContract: mainContract,
    })
  }

  getStartCampaignPledgeAddress() {
    return this.startContract.contract.address
  }

  getCampaignDonationAddress() {
    return this.donationContract.contract.address
  }

  withCategoryId(categoryId: string) {
    return new CampaignContractWithPledgeInfoAndCategoryId(
      this.electrumProvider,
      this.mainContract,
      this.exitContract,
      this.startContract,
      this.donationContract,
      this.campaignInfo,
      this.refundAddress,
      categoryId
    )
  }

  async cancelStartContract({ pledgeUtxo }: { pledgeUtxo: PledgeUtxo }) {
    return this.startContract.cancelContract({
      pledgeUtxo,
    })
  }

  async forwardStartContractToGenesis({
    pledgeUtxo,
  }: {
    pledgeUtxo: PledgeUtxo
  }) {
    return this.startContract.forwardToGenesis({
      pledgeUtxo,
    })
  }

  async forwardDonationContractToGenesis({
    pledgeUtxo,
  }: {
    pledgeUtxo: PledgeUtxo
  }) {
    return this.donationContract.forwardToGenesis({
      pledgeUtxo,
    })
  }

  async forwardStartContractToNewCampaign({
    pledgeUtxo,
  }: {
    pledgeUtxo: PledgeUtxo
  }) {
    return this.startContract.forwardToNewCampaign({
      pledgeUtxo,
    })
  }

  async forwardDonationContractToNewCampaign({
    pledgeUtxo,
  }: {
    pledgeUtxo: PledgeUtxo
  }) {
    return this.donationContract.forwardToNewCampaign({
      pledgeUtxo,
    })
  }
}

class CampaignContractWithPledgeInfoAndCategoryId {
  readonly pledgeContract: PledgeContract

  constructor(
    private readonly electrumProvider: NetworkProvider,
    private readonly mainContract: MainContract,
    private readonly exitContract: ExitContract,
    private readonly startContract: StartContract,
    private readonly donationContract: DonationContract,
    private readonly campaignInfo: CampaignInfo,
    private readonly refundAddress: string,
    private readonly categoryId: string
  ) {
    this.pledgeContract = new PledgeContract(electrumProvider, {
      categoryId: categoryId,
      contributorRefundAddress: refundAddress,
      exitContract: exitContract,
    })
  }

  getStartedCampaignPledgeAddress() {
    return this.pledgeContract.contract.address
  }

  async forwardPledgeContract({
    campaignUtxo,
    pledgeUtxo,
  }: {
    campaignUtxo: CampaignUtxo
    pledgeUtxo: PledgeUtxo
  }) {
    return this.pledgeContract.forwardToCampaign({
      mainContract: this.mainContract,
      campaignUtxo,
      pledgeUtxo,
      platformKeys: {
        pubKey: appEnv.FLIPSTARTER_PLATFORM_PUBKEY as string,
        privKey: appEnv.FLIPSTARTER_PLATFORM_PRIVKEY as string,
      },
    })
  }

  async forwardStartContract({
    campaignUtxo,
    pledgeUtxo,
  }: {
    campaignUtxo: CampaignUtxo
    pledgeUtxo: PledgeUtxo
  }) {
    return this.startContract.forwardToCampaign({
      campaignUtxo,
      pledgeUtxo,
      platformKeys: {
        pubKey: appEnv.FLIPSTARTER_PLATFORM_PUBKEY as string,
        privKey: appEnv.FLIPSTARTER_PLATFORM_PRIVKEY as string,
      },
    })
  }

  async forwardDonationContract({
    campaignUtxo,
    pledgeUtxo,
  }: {
    campaignUtxo: CampaignUtxo
    pledgeUtxo: PledgeUtxo
  }) {
    return this.donationContract.forwardToCampaign({
      campaignUtxo,
      pledgeUtxo,
      platformKeys: {
        pubKey: appEnv.FLIPSTARTER_PLATFORM_PUBKEY as string,
        privKey: appEnv.FLIPSTARTER_PLATFORM_PRIVKEY as string,
      },
    })
  }

  async refundBeforeExpiration({
    campaignUtxo,
    forwardedUtxo,
  }: {
    campaignUtxo: CampaignUtxo
    forwardedUtxo: ForwardedPledgeUtxo
  }) {
    return this.exitContract.refundBeforeExpiration({
      mainContract: this.mainContract,
      returnAddress: this.refundAddress,
      campaignUtxo,
      forwardedUtxo,
      platformKeys: {
        pubKey: appEnv.FLIPSTARTER_PLATFORM_PUBKEY as string,
        privKey: appEnv.FLIPSTARTER_PLATFORM_PRIVKEY as string,
      },
    })
  }

  async refundAfterExpiration({
    campaignUtxo,
    forwardedUtxo,
  }: {
    campaignUtxo: CampaignUtxo
    forwardedUtxo: ForwardedPledgeUtxo
  }) {
    return this.exitContract.refundAfterExpiration({
      mainContract: this.mainContract,
      returnAddress: this.refundAddress,
      campaignUtxo,
      forwardedUtxo,
    })
  }

  async cancelPledgeContract({ pledgeUtxo }: { pledgeUtxo: PledgeUtxo }) {
    return this.pledgeContract.cancelContract({
      pledgeUtxo,
    })
  }
}
