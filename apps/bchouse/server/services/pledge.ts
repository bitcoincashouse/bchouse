import { PledgeEvent, inngest } from '@bchouse/inngest'
import { nanoid } from 'nanoid'
import { logger } from '../../app/utils/logger'
import moment from '../../app/utils/moment'
import { db } from '../db'
import * as campaignRepository from '../repositories/campaign'
import * as pledgeRepository from '../repositories/pledge'
import { getManyPledges } from '../repositories/pledge'
import { paygateInvoiceReq } from '../utils/paygateInvoiceReq'
import { CampaignService } from './campaign'

type SubscriptionCallback = (event: 'success' | 'error') => void
type PledgeEventData = {
  postId: string
  pledgeAmount: bigint
  refundAddress: string
  sessionId: string
}

export class PledgeService {
  constructor(private readonly campaignService: CampaignService) {}

  readonly subscriptions = new Map<string, SubscriptionCallback>()

  subscribe(requestId: string, callback: SubscriptionCallback) {
    this.subscriptions.set(requestId, callback)
    return requestId
  }

  unsubscribe(requestId: string) {
    this.subscriptions.delete(requestId)
  }

  async addComment({
    name,
    comment,
    secret,
  }: {
    name: string | undefined
    comment: string | undefined
    secret: string
  }) {
    const result = await db
      .updateTable('PledgePayment')
      .set({
        name,
        comment,
      })
      .where((eb) =>
        eb.exists(
          eb
            .selectFrom('PledgeRequest')
            .where((eb) =>
              eb
                .eb('PledgeRequest.id', '=', eb.ref('PledgePayment.pledgeId'))
                .and('PledgeRequest.secret', '=', secret)
            )
            .select('PledgePayment.pledgeId')
        )
      )
      .executeTakeFirst()

    return (result.numChangedRows || 0) > 0n || result.numUpdatedRows > 0n
  }

  async publishSuccessfulPledge(event: PledgeEvent['data']) {
    //Publish to subscribers (SSE)
    Promise.resolve().then(() => {
      try {
        this.subscriptions.get(event.pledgeRequestId)?.('success')
      } catch (err) {
        logger.error('Failed to publish pledge event', err)
      }
    })

    await inngest.send({
      name: 'pledge/success',
      data: event,
    })
  }

  async createInvoice({
    amount,
    campaignId,
    refundAddress,
    userId,
    paygateUrl,
    bchouseUrl,
  }: {
    amount: bigint
    refundAddress: string
    campaignId: string
    userId: string | null
    paygateUrl: string
    bchouseUrl: string
  }) {
    const campaign = await campaignRepository.getCampaignById({
      id: campaignId,
    })

    if (!campaign) {
      throw new Error('Campaign does not exist')
    }

    const secret = nanoid()

    const pledgeType = campaign.contract?.categoryId ? 'STARTED' : 'STARTING'

    const pledgeAddress = await this.campaignService.getCampaignPledgeAddress({
      campaignInfo: {
        payoutAddress: campaign.address,
        expires: campaign.expires,
        amount: campaign.amount,
        network: campaign.network,
        version: campaign.version,
      },
      pledgeInfo: {
        type: pledgeType,
        refundAddress,
      },
      campaignUtxo: campaign.contract
        ? {
            categoryId: campaign.contract.categoryId,
          }
        : null,
    })

    const refundUrl = `${bchouseUrl}/campaign/pledge/refund/${secret}`
    //TODO: If categoryId exists, then may be possible to extract parameters.
    // so if platform initializes, no need for most contract parameters when combined with this.
    const memo = campaign.contract
      ? `BCHouse Campaign Details:
Refund url: ${refundUrl}
Refund Address: ${refundAddress},
Category: ${campaign.contract.categoryId},`
      : `BCHouse Campaign Details:
Refund url: ${refundUrl}
Refund Address: ${refundAddress},
Goal: ${campaign.amount},
Payout: ${campaign.address},
Expires: ${moment(campaign.expires).unix()}`

    const { invoiceId, paymentUrl } = await paygateInvoiceReq(paygateUrl, {
      network: campaign.network,
      address: pledgeAddress,
      amount: Number(amount),
      memo,
      //Send a inngest event for us to react to
      event: {
        name: 'pledge/deposit',
        data: {
          campaignId,
          userId,
          secret,
          pledgeType,
          refundAddress,
        },
      },
    })

    //TODO: Remove pledge request
    await pledgeRepository.createPledgeRequest({
      campaignId: campaign.campaignId,
      network: campaign.network,
      userId,
      secret,
      requestId: invoiceId,
    })

    const expiresUnixTimestamp = moment(campaign.expires).unix()
    const contractParams = campaign.contract
      ? campaign.contract?.categoryId
      : `${campaign.address}/${campaign.amount}/${expiresUnixTimestamp}`

    return {
      invoiceId,
      paymentUrl: `${paymentUrl}/${refundAddress}/${contractParams}`,
      network: campaign.network,
      secret,
    }
  }

  async getPledges(params: { userId: string | null; pledgeSecrets: string[] }) {
    //If there's a user, fetch all their pledge requests
    //For all session ids, fetch and check if they have payments
    return getManyPledges({
      userId: params.userId,
      pledgeSecrets: params.pledgeSecrets,
    })
  }

  async getAnyonecanpayPledges({ campaignId }: { campaignId: string }) {
    return pledgeRepository.getAnyonecanpayPledgesComplete(campaignId)
  }

  async getPledgePayment(requestId: string) {
    return pledgeRepository.getPledgePaymentByRequestId({ id: requestId })
  }

  async getPledgeBySecret({ secret }: { secret: string }) {
    const pledgePayment =
      await pledgeRepository.getCurrentPledgeTransactionBySecret({
        secret,
      })

    return pledgePayment
  }

  async cancelPledge({ secret }: { secret: string }) {
    const pledgePayment =
      await pledgeRepository.getCurrentPledgeTransactionBySecret({
        secret,
      })

    if (pledgePayment.refundTxId) {
      return {
        txid: pledgePayment.refundTxId,
      }
    }

    if (pledgePayment.fulfillmentTxId) {
      throw new Error('Campaign already completed')
    }

    const campaign = await campaignRepository.getCampaignByIdWithPledges({
      id: pledgePayment.campaignId,
    })

    const result = await this.campaignService.cancelPledge({
      pledgeInfo: {
        pledgeId: pledgePayment.pledgeRequestId,
        refundAddress: pledgePayment.refundAddress,
        type: pledgePayment.type,
      },
      campaignInfo: {
        amount: campaign.amount,
        expires: campaign.expires,
        payoutAddress: campaign.address,
        campaignId: campaign.campaignId,
        network: campaign.network,
        version: campaign.version,
      },
      pledgeUtxo: pledgePayment,
      campaignUtxo: campaign.contract
        ? {
            categoryId: campaign.contract.categoryId,
            satoshis: campaign.contract.satoshis,
            txid: campaign.contract.txid,
            vout: 0,
          }
        : null,
      forwardedUtxo: pledgePayment.forwardTx,
    })

    if ('campaignUtxo' in result) {
      if (!campaign.contract) {
        throw new Error('Unexpected error: campaign contract not populated')
      }

      await campaignRepository.saveCampaignContract({
        //Starting utxo
        campaignId: campaign.campaignId,
        parentTxId: campaign.contract.txid,
        categoryId: campaign.contract.categoryId,

        //Next utxo
        txid: result.campaignUtxo.txid,
        satoshis: result.campaignUtxo.satoshis,

        //Action details
        opts: {
          type: 'REFUND',
          pledgeRefundId: pledgePayment.pledgeRequestId,
        },
      })
    } else {
      await pledgeRepository.saveCancelledPledge({
        pledgeRequestId: pledgePayment.pledgeRequestId,
        cancelTxId: result.refundedUtxo.txid,
      })
    }

    return {
      txid: result.refundedUtxo.txid,
    }
  }
}
