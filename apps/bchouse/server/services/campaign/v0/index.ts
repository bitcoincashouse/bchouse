import { NetworkProvider } from 'cashscript'
import moment from '~/server/utils/moment'
import { formatAddress } from '~/utils/bchUtils'
import {
  AbstractCampaignContract,
  CampaignInfo,
  CampaignUtxo,
  ForwardedPledgeUtxo,
  PledgeType,
  PledgeUtxo,
} from '../types'
import { CampaignContractApi } from './api'

export class V0CampaignContract extends AbstractCampaignContract {
  constructor(
    private readonly electrumProvider: NetworkProvider,
    private readonly campaignInfo: CampaignInfo
  ) {
    super()
  }

  override getDonationAddress(): string {
    //Campaign donation address is a pledge with refund to campaigner
    //Use start address so first donation can create the campaign and later ones can
    // be pledged to an existing pledge givenn the unlocking bytecode.
    // no need to watch both start/started addresses
    return new CampaignContractApi(this.electrumProvider, this.campaignInfo)
      .withPledgeFrom(this.campaignInfo.payoutAddress)
      .getCampaignDonationAddress()
  }

  override getPledgeAddress(
    refundAddress: string,
    pledgeType: PledgeType,
    categoryId?: string
  ): string {
    const campaignContract = new CampaignContractApi(
      this.electrumProvider,
      this.campaignInfo
    ).withPledgeFrom(refundAddress)

    if (pledgeType === 'STARTING') {
      return campaignContract.getStartCampaignPledgeAddress()
    } else if (pledgeType === 'DONATION') {
      return campaignContract.getCampaignDonationAddress()
    } else if (pledgeType === 'STARTED' && categoryId) {
      return campaignContract
        .withCategoryId(categoryId)
        .getStartedCampaignPledgeAddress()
    } else {
      throw new Error(
        "campaign contract not created but pledgeType is 'started'"
      )
    }
  }

  override async complete(campaignUtxo: CampaignUtxo) {
    const electrumProvider = this.electrumProvider
    const campaignInfo = this.campaignInfo

    const completedTx = await new CampaignContractApi(
      electrumProvider,
      campaignInfo
    )
      .withCategoryId(campaignUtxo.categoryId)
      .complete({
        campaignUtxo,
      })

    return completedTx
  }

  override async forwardPledge(
    pledgeId: string,
    refundAddress: string,
    pledgeType: PledgeType,
    pledgeUtxo: PledgeUtxo,
    campaignUtxo?: CampaignUtxo | null,
    onForwardPledge?: (pledgeUtxo: PledgeUtxo) => Promise<void>
  ) {
    const electrumProvider = this.electrumProvider
    const campaignInfo = this.campaignInfo

    const campaignContract = new CampaignContractApi(
      electrumProvider,
      campaignInfo
    ).withPledgeFrom(refundAddress)

    //If successful and campaign creation, we can move from campaign create contract to campaign-main and save the category ID
    //If successful and campaign pledge, we can move from campaign pledge contract to campaign-main, creating an NFT for on-demand refunds. (could pass a secret to user to refund)
    if (pledgeType === 'STARTED' && campaignUtxo?.categoryId) {
      return await campaignContract
        .withCategoryId(campaignUtxo.categoryId)
        .forwardPledgeContract({ campaignUtxo, pledgeUtxo })
    } else if (pledgeType === 'STARTING' && campaignUtxo) {
      return await campaignContract
        .withCategoryId(campaignUtxo.categoryId)
        .forwardStartContract({ campaignUtxo, pledgeUtxo })
    } else if (pledgeType === 'DONATION' && campaignUtxo) {
      return await campaignContract
        .withCategoryId(campaignUtxo.categoryId)
        .forwardDonationContract({ campaignUtxo, pledgeUtxo })
    } else if (pledgeType === 'STARTING' && !campaignUtxo) {
      if (pledgeUtxo.vout !== 0) {
        const result = await campaignContract.forwardStartContractToGenesis({
          pledgeUtxo,
        })

        await onForwardPledge?.(result.pledgeUtxo)

        pledgeUtxo = result.pledgeUtxo
      }

      return await campaignContract.forwardStartContractToNewCampaign({
        pledgeUtxo,
      })
    } else if (pledgeType === 'DONATION' && !campaignUtxo) {
      if (pledgeUtxo.vout !== 0) {
        const result = await campaignContract.forwardDonationContractToGenesis({
          pledgeUtxo,
        })

        await onForwardPledge?.(result.pledgeUtxo)

        pledgeUtxo = result.pledgeUtxo
      }

      return await campaignContract.forwardDonationContractToNewCampaign({
        pledgeUtxo,
      })
    }

    throw new Error('Pledge not forwarded: ' + pledgeId)
  }

  override async cancelPledge(
    pledgeId: string,
    refundAddress: string,
    pledgeType: PledgeType,
    pledgeUtxo: PledgeUtxo,
    forwardedUtxo?: ForwardedPledgeUtxo | null,
    campaignUtxo?: CampaignUtxo | null
  ) {
    const electrumProvider = this.electrumProvider
    const campaignInfo = this.campaignInfo

    const prefixedRefundAddress = formatAddress(
      this.campaignInfo.network,
      refundAddress
    )

    const isExpired = campaignInfo.expires <= moment().unix()
    if (pledgeType === 'DONATION') {
      //TODO: This should be enforced by contract, where instead of pledge contract, it's a donation version that only allows refunding if campaign expired
      // right now only enforced application side
      throw new Error('Donations can only be cancelled by the refund process')
    }

    if (!forwardedUtxo && pledgeType === 'STARTING') {
      return await new CampaignContractApi(electrumProvider, campaignInfo)
        .withPledgeFrom(prefixedRefundAddress)
        .cancelStartContract({
          pledgeUtxo,
        })
    } else if (!forwardedUtxo && pledgeType === 'STARTED' && campaignUtxo) {
      return await new CampaignContractApi(electrumProvider, campaignInfo)
        .withPledgeFrom(prefixedRefundAddress)
        .withCategoryId(campaignUtxo.categoryId)
        .cancelPledgeContract({
          pledgeUtxo,
        })
    } else if (forwardedUtxo && campaignUtxo) {
      //Cancel a exit contract with refundAfterExpiration
      const campaignContract = new CampaignContractApi(
        electrumProvider,
        campaignInfo
      )
        .withPledgeFrom(prefixedRefundAddress)
        .withCategoryId(campaignUtxo.categoryId)

      return !isExpired
        ? await campaignContract.refundBeforeExpiration({
            campaignUtxo,
            forwardedUtxo,
          })
        : await campaignContract.refundAfterExpiration({
            campaignUtxo,
            forwardedUtxo,
          })
    }

    throw new Error('Pledge not refunded: ' + pledgeId)
  }

  override async refundAfterExpiration(
    refundAddress: string,
    forwardedUtxo: ForwardedPledgeUtxo,
    campaignUtxo: CampaignUtxo
  ) {
    const electrumProvider = this.electrumProvider
    const campaignInfo = this.campaignInfo

    const prefixedRefundAddress = formatAddress(
      this.campaignInfo.network,
      refundAddress
    )

    const isExpired = campaignInfo.expires <= moment().unix()

    if (!isExpired) throw new Error('Campaign not expired')

    //Cancel a exit contract with refundAfterExpiration
    const campaignContract = new CampaignContractApi(
      electrumProvider,
      campaignInfo
    )
      .withPledgeFrom(prefixedRefundAddress)
      .withCategoryId(campaignUtxo.categoryId)

    return await campaignContract.refundAfterExpiration({
      campaignUtxo,
      forwardedUtxo,
    })
  }
}
