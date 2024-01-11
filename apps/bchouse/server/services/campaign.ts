import { getInngestEvent, inngest } from '@bchouse/inngest'
import { lockingBytecodeToCashAddress } from '@bitauth/libauth'
import pReduce from 'p-reduce'
import { v4 } from 'uuid'
import { formatAddress, getPrefix } from '../../app/utils/bchUtils'
import { CampaignEventData } from '../../app/utils/campaignEventSchema'
import { logger } from '../../app/utils/logger'
import { Network, PledgeType, db } from '../db'
import * as campaignRepository from '../repositories/campaign'
import * as pledgeRepository from '../repositories/pledge'
import { saveAnyonecanpayPledgeSpent } from '../repositories/pledge'
import {
  parseCommitmentFromElectronCash,
  validateContribution,
} from '../utils/anyonecanpay'
import { ElectrumNetworkProviderService } from '../utils/getElectrumProvider'
import moment from '../utils/moment'
import { AddressWatcher } from './address-watcher'
import { getCampaignContract } from './campaign/getCampaignContract'
export type SubscriptionCallback = (event: CampaignEventData) => void

export class CampaignService {
  readonly subscriptions = new Map<string, Map<string, SubscriptionCallback>>()

  constructor(
    private readonly electrumProviderService: ElectrumNetworkProviderService,
    private readonly addressWatcher: AddressWatcher
  ) {}

  subscribe(campaignId: string, callback: SubscriptionCallback) {
    const callbacks = this.subscriptions.get(campaignId) || new Map()
    const id = v4()
    callbacks.set(id, callback)
    this.subscriptions.set(campaignId, callbacks)
    return id
  }

  unsubscribe(campaignId: string, id: string) {
    const callbacks = this.subscriptions.get(campaignId)
    callbacks?.delete(id)
  }

  onCampaignUpdate(event: {
    campaignId: string
    satoshis: string
    contributionCount: number
    fulfillmentTimestamp?: number
  }) {
    try {
      this.subscriptions.get(event.campaignId)?.forEach((cb) => {
        cb({
          campaignId: event.campaignId,
          total: event.satoshis,
          contributionCount: event.contributionCount,
          fulfillmentTimestamp: event.fulfillmentTimestamp,
        })
      })
    } catch (err) {
      logger.error('Failed to publish campaign event', err)
    }
  }

  getDonationAddress(campaignInfo: {
    payoutAddress: string
    amount: bigint
    expires: number
    network: Network
    version: number
  }) {
    const electrumProvider = this.electrumProviderService.getElectrumProvider(
      campaignInfo.network
    )

    return getCampaignContract(
      electrumProvider,
      campaignInfo
    ).getDonationAddress()
  }

  async getUiContributions(campaignId: string) {
    return pledgeRepository.getUiContributions(campaignId)
  }

  async getAllContributions(campaignId: string) {
    return pledgeRepository.getAllContributions(campaignId)
  }

  async getCampaignPledgeAddress({
    campaignInfo,
    pledgeInfo,
    campaignUtxo,
  }: {
    campaignInfo: {
      payoutAddress: string
      amount: bigint
      expires: number
      network: Network
      version: number
    }
    pledgeInfo: {
      refundAddress: string
      type: PledgeType
    }
    campaignUtxo: {
      categoryId: string
    } | null
  }) {
    if (campaignInfo.expires <= moment().unix()) {
      throw new Error('Campaign is expired')
    }

    const electrumProvider = this.electrumProviderService.getElectrumProvider(
      campaignInfo.network
    )

    return getCampaignContract(electrumProvider, campaignInfo).getPledgeAddress(
      pledgeInfo.refundAddress,
      pledgeInfo.type,
      campaignUtxo?.categoryId
    )
  }

  async getCampaignByIdWithPledges(id: string) {
    return campaignRepository.getCampaignByIdWithPledges({ id })
  }

  async _getRefundableCampaigns() {
    return campaignRepository.getRefundableCampaigns()
  }

  async getCampaignById(id: string) {
    return campaignRepository.getCampaignById({ id })
  }

  async getActiveCampaigns(params: { limit: number; username?: string }) {
    return campaignRepository.getActiveCampaigns(params)
  }

  async validateAnyonecanpayPledge(campaignId: string, payload: string) {
    const commitment = parseCommitmentFromElectronCash(payload)
    const campaign = await campaignRepository.getCampaignById({
      id: campaignId,
    })

    const isDuplicate = await pledgeRepository.getAnyonecanpayPledge(
      campaignId,
      commitment.txHash,
      commitment.txIndex
    )

    if (!!isDuplicate) {
      logger.error('Duplicate commitment', isDuplicate)
      throw new Error('Duplicate commitment')
    }

    const electrumCluster = this.electrumProviderService.getElectrumCluster(
      campaign.network
    )

    const tx = (await electrumCluster.request(
      'blockchain.transaction.get',
      commitment.txHash,
      true
    )) as {
      vout: {
        scriptPubKey: {
          hex: string
        }
      }[]
    } | null

    const isUnspent = (await electrumCluster.request(
      'blockchain.utxo.get_info',
      commitment.txHash,
      commitment.txIndex
    )) as {
      value: number
    } | null

    if (isUnspent === null) {
      throw new Error('Utxo spent')
    }

    const output = tx?.vout[commitment.txIndex]

    if (!output) {
      throw new Error('Utxo not found')
    }

    return validateContribution(
      {
        satoshis: isUnspent.value,
        lockingScript: output.scriptPubKey.hex,
        seqNum: commitment.seqNum,
        txHash: commitment.txHash,
        txIndex: commitment.txIndex,
        unlockingScript: commitment.unlockingScript,
      },
      [
        {
          address: campaign.address,
          satoshis: Number(campaign.amount),
        },
      ]
    )
  }

  async submitAnyonecanpayPledge(
    campaignId: string,
    payload: string,
    userId?: string | null
  ) {
    const commitment = parseCommitmentFromElectronCash(payload)
    const campaign = await campaignRepository.getCampaignByIdWithPledges({
      id: campaignId,
    })

    if (campaign.version < 2) {
      throw new Error('Campaign does not support anyonecanpay pledges')
    }

    const isDuplicate = await pledgeRepository.getAnyonecanpayPledge(
      campaignId,
      commitment.txHash,
      commitment.txIndex
    )

    if (!!isDuplicate) {
      logger.error('Duplicate commitment', isDuplicate)
      throw new Error('Duplicate commitment')
    }

    const electrumCluster = this.electrumProviderService.getElectrumCluster(
      campaign.network
    )

    const tx = (await electrumCluster.request(
      'blockchain.transaction.get',
      commitment.txHash,
      true
    )) as {
      vout: {
        scriptPubKey: {
          hex: string
        }
      }[]
    } | null

    const isUnspent = (await electrumCluster.request(
      'blockchain.utxo.get_info',
      commitment.txHash,
      commitment.txIndex
    )) as {
      value: number
    } | null

    if (isUnspent === null) {
      throw new Error('Utxo spent')
    }

    const output = tx?.vout[commitment.txIndex]

    if (!output) {
      throw new Error('Utxo not found')
    }

    const isValid = validateContribution(
      {
        satoshis: isUnspent.value,
        lockingScript: output.scriptPubKey.hex,
        seqNum: commitment.seqNum,
        txHash: commitment.txHash,
        txIndex: commitment.txIndex,
        unlockingScript: commitment.unlockingScript,
      },
      [
        {
          address: campaign.address,
          satoshis: Number(campaign.amount),
        },
      ]
    )

    if (isValid) {
      const pledgeId = v4()

      const address = lockingBytecodeToCashAddress(
        Buffer.from(output.scriptPubKey.hex, 'hex'),
        getPrefix(campaign.network)
      )

      if (typeof address !== 'string') {
        throw address.error
      }

      //Subscribe to outpoint so if spent, will publish notification to inngest
      await this.addressWatcher.subscribe({
        id: campaignId,
        address: address,
        network: campaign.network,
        event: {
          name: 'pledge/check-spent',
          data: {
            pledgeId,
            txid: commitment.txHash,
            vout: commitment.txIndex,
            network: campaign.network,
            address,
            campaignId,
          },
        } satisfies getInngestEvent<'pledge/check-spent'>,
      })

      await pledgeRepository.saveAnyonecanpayPledge({
        pledgeId,
        campaignId,
        txid: commitment.txHash,
        vout: commitment.txIndex,
        satoshis: BigInt(isUnspent.value),
        lockingScript: output.scriptPubKey.hex,
        unlockingScript: commitment.unlockingScript,
        comment: commitment.comment,
        name: commitment.name,
        userId,
        address,
      })

      const anyonecanpayPledges = await pledgeRepository.getAnyonecanpayPledges(
        campaignId
      )

      const totalAnyonecanpayPledgeAmount = anyonecanpayPledges.reduce(
        (s, p) => s + BigInt(p.satoshis),
        0n
      )

      const totalAmount =
        (campaign.contract?.satoshis || 0n) + totalAnyonecanpayPledgeAmount

      this.onCampaignUpdate({
        campaignId: campaign.campaignId,
        satoshis: totalAmount.toString(),
        contributionCount: campaign.pledges + 1,
      })

      //handle completed campaign
      if (totalAmount >= campaign.amount) {
        Promise.resolve().then(() => {
          return inngest.send({
            name: 'campaign/complete' as const,
            data: {
              id: campaign.campaignId,
            },
          })
        })
      }

      return {
        pledgeId,
      }
    } else {
      throw new Error('invalid pledge submitted')
    }
  }

  async forwardPledge({
    campaignInfo,
    campaignUtxo,
    pledgeInfo,
    pledgeUtxo,
  }: {
    campaignInfo: {
      amount: bigint
      expires: number
      payoutAddress: string
      campaignId: string
      network: Network
      version: number
    }
    pledgeInfo: {
      pledgeId: string
      refundAddress: string
      type: PledgeType
    }
    pledgeUtxo: {
      txid: string
      vout: number
      satoshis: bigint
    }
    campaignUtxo: {
      txid: string
      vout: number
      satoshis: bigint
      categoryId: string
    } | null
  }) {
    const electrumProvider = this.electrumProviderService.getElectrumProvider(
      campaignInfo.network
    )

    return getCampaignContract(electrumProvider, campaignInfo).forwardPledge(
      pledgeInfo.pledgeId,
      pledgeInfo.refundAddress,
      pledgeInfo.type,
      pledgeUtxo,
      campaignUtxo,
      async (pledgeUtxo) => {
        //Save pledge
        //TODO: Don't overwrite
        return await pledgeRepository.saveForwardedPledge({
          pledgeRequestId: pledgeInfo.pledgeId,
          satoshis: pledgeUtxo.satoshis,
          txid: pledgeUtxo.txid,
          vout: pledgeUtxo.vout,
        })
      }
    )
  }

  async cancelPledge({
    campaignInfo,
    campaignUtxo,
    forwardedUtxo,
    pledgeInfo,
    pledgeUtxo,
  }: {
    campaignInfo: {
      amount: bigint
      expires: number
      payoutAddress: string
      campaignId: string
      network: Network
      version: number
    }
    pledgeInfo: {
      pledgeId: string
      refundAddress: string
      type: PledgeType
    }
    pledgeUtxo: {
      txid: string
      vout: number
      satoshis: bigint
    }
    campaignUtxo: {
      txid: string
      vout: number
      satoshis: bigint
      categoryId: string
    } | null
    forwardedUtxo: {
      txid: string
      vout: number
      satoshis: bigint
      categoryId: string
      pledgedAmount: bigint
    } | null
  }) {
    const electrumProvider = this.electrumProviderService.getElectrumProvider(
      campaignInfo.network
    )

    return getCampaignContract(electrumProvider, campaignInfo).cancelPledge(
      pledgeInfo.pledgeId,
      pledgeInfo.refundAddress,
      pledgeInfo.type,
      pledgeUtxo,
      forwardedUtxo,
      campaignUtxo
    )
  }

  async handleSpentAnyonecanpayPledge({
    campaignId,
    txid,
    vout,
    pledgeId,
    address,
    network,
  }: getInngestEvent<'pledge/check-spent'>['data']) {
    console.log('checking anyonecanpaypledge spent')
    const cluster = this.electrumProviderService.getElectrumCluster(network)
    const isUnspent = await cluster.request(
      'blockchain.utxo.get_info',
      txid,
      vout
    )

    if (isUnspent === null) {
      //Most likely spent, can iterate history to be sure
      await saveAnyonecanpayPledgeSpent(pledgeId)

      await this.addressWatcher.unsubscribe({
        id: pledgeId,
        address,
        network,
      })

      await inngest.send({
        name: 'campaign/update',
        data: {
          campaignId,
        },
      })
    }
  }

  async handleUpdateCampaign(campaignId: string) {
    const [campaign, anyonecanpayPledges] = await Promise.all([
      campaignRepository.getCampaignByIdWithPledges({
        id: campaignId,
      }),
      pledgeRepository.getAnyonecanpayPledges(campaignId),
    ])

    const totalAnyonecanpayPledgeAmount = anyonecanpayPledges.reduce(
      (s, p) => s + BigInt(p.satoshis),
      0n
    )

    this.onCampaignUpdate({
      campaignId: campaign.campaignId,
      satoshis: (
        (campaign.contract?.satoshis || 0n) + totalAnyonecanpayPledgeAmount
      ).toString(),
      contributionCount: campaign.pledges + 1,
    })
  }

  async handleCampaignSync(
    campaignId: string,
    donationAddress: string,
    network: Network
  ) {
    const anyonecanpayPledges =
      await pledgeRepository.getAnyonecanpayPledgesComplete(campaignId)

    const donationSubPromise = this.addressWatcher.subscribe({
      id: campaignId,
      address: donationAddress,
      network: network,
      event: {
        name: 'pledge/check-donation',
        data: {
          donationAddress,
        },
      } satisfies getInngestEvent<'pledge/check-donation'>,
    })

    const pledgeSubPromises = anyonecanpayPledges.map((pledge) =>
      Promise.resolve()
        .then(async () => {
          const address = lockingBytecodeToCashAddress(
            Buffer.from(pledge.lockingScript, 'hex'),
            getPrefix(network)
          )

          if (typeof address !== 'string') {
            throw address.error
          }

          await this.addressWatcher.subscribe({
            id: pledge.pledgeId,
            address: address,
            network: network,
            event: {
              name: 'pledge/check-spent',
              data: {
                campaignId,
                pledgeId: pledge.pledgeId,
                txid: pledge.txid,
                vout: pledge.vout,
                address,
                network: network,
              },
            } satisfies getInngestEvent<'pledge/check-spent'>,
          })
        })
        .catch((err) => {
          logger.error('Failed to subscribe to pledge', pledge.pledgeId, err)
        })
    )

    return await Promise.all([donationSubPromise, ...pledgeSubPromises])
  }

  async handleCheckDonation(donationAddress: string) {
    const campaign = await campaignRepository.getCampaignByDonationAddress({
      address: donationAddress,
    })

    const campaignInfo = {
      amount: campaign.amount,
      expires: campaign.expires,
      network: campaign.network,
      payoutAddress: campaign.address,
    }

    const electrumProvider = this.electrumProviderService.getElectrumProvider(
      campaign.network
    )

    const utxos = await electrumProvider.getUtxos(
      formatAddress(campaign.network, donationAddress)
    )

    logger.info('Fetched utxos', campaign.campaignId, utxos, donationAddress)

    if (utxos.length) {
      const pledgeRequestIds: string[] = []

      await db.transaction().execute(async (trx) => {
        await Promise.all(
          utxos.map(async (donationUtxo) => {
            const existingPledgeId = await trx
              .selectFrom('PledgePayment')
              .where('PledgePayment.txid', '=', donationUtxo.txid)
              .select('PledgePayment.pledgeId')
              .executeTakeFirst()

            if (!existingPledgeId) {
              const pledgeRequestId = v4()

              await db
                .insertInto('PledgePayment')
                .values({
                  pledgeId: pledgeRequestId,
                  txid: donationUtxo.txid,
                  vout: donationUtxo.vout,
                  returnAddress: campaignInfo.payoutAddress,
                  satoshis: donationUtxo.satoshis,
                  address: donationAddress,
                  type: campaign.version === 0 ? 'STARTING' : 'DONATION',
                })
                .execute()

              await trx
                .insertInto('PledgeRequest')
                .values({
                  id: pledgeRequestId,
                  campaignId: campaign.campaignId,
                  network: campaignInfo.network,
                })
                .execute()

              pledgeRequestIds.push(pledgeRequestId)
            } else {
              pledgeRequestIds.push(existingPledgeId.pledgeId)
            }
          })
        )
      })

      logger.info('Publishing pledges', pledgeRequestIds)

      await inngest.send(
        pledgeRequestIds.map((id) => ({
          name: 'pledge/success',
          data: {
            pledgeRequestId: id,
          },
        }))
      )
    }
  }

  async handlePledgeSuccess(pledgeRequestId: string) {
    const pledgePayment = await pledgeRepository.getPledgePaymentByRequestId({
      id: pledgeRequestId,
    })

    if (!pledgePayment) {
      logger.error('Payment not found: ' + pledgeRequestId)
      throw new Error('Payment not found')
    }
    const [campaign, anyonecanpayPledges] = await Promise.all([
      campaignRepository.getCampaignByIdWithPledges({
        id: pledgePayment.campaignId,
      }),
      pledgeRepository.getAnyonecanpayPledges(pledgePayment.campaignId),
    ])

    const result = await this.forwardPledge({
      campaignInfo: {
        amount: campaign.amount,
        expires: campaign.expires,
        payoutAddress: campaign.address,
        campaignId: campaign.campaignId,
        network: campaign.network,
        version: campaign.version,
      },
      pledgeInfo: {
        pledgeId: pledgeRequestId,
        refundAddress: pledgePayment.refundAddress,
        type: pledgePayment.type,
      },
      pledgeUtxo: {
        satoshis: pledgePayment.pledgeAmount,
        txid: pledgePayment.txid,
        vout: pledgePayment.vout,
      },
      campaignUtxo: campaign.contract
        ? {
            categoryId: campaign.contract.categoryId,
            satoshis: campaign.contract.satoshis,
            txid: campaign.contract.txid,
            vout: campaign.contract.vout,
          }
        : null,
    })

    await campaignRepository.saveCampaignContract({
      //Starting utxo
      campaignId: pledgePayment.campaignId,
      parentTxId: campaign.contract?.txid,

      //Next utxo
      txid: result.campaignUtxo.txid,
      satoshis: result.campaignUtxo.satoshis,
      categoryId: result.campaignUtxo.categoryId,

      //Action details
      opts: {
        type: 'PLEDGE',
        pledgePaymentId: pledgeRequestId,
        nftOutput: {
          satoshis: result.forwardedPledge.satoshis,
        },
      },
    })

    const totalAnyonecanpayPledgeAmount = anyonecanpayPledges.reduce(
      (s, p) => s + BigInt(p.satoshis),
      0n
    )

    this.onCampaignUpdate({
      campaignId: campaign.campaignId,
      satoshis: (
        result.campaignUtxo.satoshis + totalAnyonecanpayPledgeAmount
      ).toString(),
      contributionCount: campaign.pledges + 1,
    })

    //handle completed campaign
    if (
      result.campaignUtxo.satoshis + totalAnyonecanpayPledgeAmount >=
      campaign.amount
    ) {
      Promise.resolve().then(() => {
        return inngest.send({
          name: 'campaign/complete' as const,
          data: {
            id: campaign.campaignId,
          },
        })
      })
    }

    return campaign
      ? `Pledge completed: ${result.campaignUtxo.txid}`
      : `Campaign started: ${result.campaignUtxo.txid}\nCampaign category: ${result.campaignUtxo.categoryId}`
  }

  async handleCampaignExpired(id: string) {
    const [campaign, refundablePledges, anyonecanpayPledges] =
      await Promise.all([
        campaignRepository.getCampaignById({ id }),
        campaignRepository.getCampaignRefundablePledges(id),
        pledgeRepository.getAnyonecanpayPledges(id),
      ])

    const totalAnyonecanpayPledgeAmount = anyonecanpayPledges.reduce(
      (s, p) => s + BigInt(p.satoshis),
      0n
    )

    if (campaign.contract) {
      const contract = campaign.contract
      const electrumProvider = this.electrumProviderService.getElectrumProvider(
        campaign.network
      )
      const campaignContract = getCampaignContract(electrumProvider, {
        amount: campaign.amount,
        expires: campaign.expires,
        payoutAddress: campaign.address,
        network: campaign.network,
        version: campaign.version,
      })

      //Refund forwarded pledges one by one, LIFO
      await pReduce(
        refundablePledges.filter((pledge) => pledge.pledgedAmount > 2000),
        async (campaignUtxo, pledge) => {
          // TODO: make sure we still fetch pledge count if refunded after createddate
          const result = await campaignContract.refundAfterExpiration(
            pledge.returnAddress,
            {
              txid: pledge.forwardTxId,
              satoshis: pledge.forwardSatoshis,
              pledgedAmount: pledge.pledgedAmount,
              vout: 1,
            },
            {
              satoshis: campaignUtxo.satoshis,
              txid: campaignUtxo.txid,
              vout: 0,
              categoryId: contract.categoryId,
            }
          )

          await campaignRepository.saveCampaignContract({
            //Starting utxo
            campaignId: campaign.campaignId,
            parentTxId: campaignUtxo.txid,

            //Next utxo
            txid: result.campaignUtxo.txid,
            satoshis: result.campaignUtxo.satoshis,
            categoryId: contract.categoryId,

            //Action details
            opts: {
              type: 'REFUND',
              pledgeRefundId: pledge.pledgeRequestId,
            },
          })

          return result.campaignUtxo
        },
        {
          txid: campaign.contract.txid,
          satoshis: campaign.contract.satoshis,
        }
      )
    }

    await campaignRepository.saveCampaignRefunded({
      campaignId: campaign.campaignId,
      pledgedAmount:
        (campaign.contract?.satoshis || 0n) + totalAnyonecanpayPledgeAmount,
    })

    await this.addressWatcher
      .unsubscribe({
        id: campaign.campaignId,
        address: campaign.donationAddress,
        network: campaign.network,
      })
      .catch((err) => {
        logger.error('Error unsubscribing after expiration', err)
      })

    return refundablePledges.map((p) => p.pledgeRequestId)
  }

  async handleCampaignComplete(id: string) {
    const [campaign, anyonecanpayPledges] = await Promise.all([
      campaignRepository.getCampaignByIdWithPledges({
        id,
      }),
      pledgeRepository.getAnyonecanpayPledgesComplete(id),
    ])

    const totalAnyonecanpayPledgeAmount = anyonecanpayPledges.reduce(
      (s, p) => s + BigInt(p.satoshis),
      0n
    )

    const totalPledged =
      (campaign.contract?.satoshis || 0n) + totalAnyonecanpayPledgeAmount

    //TODO: Throw/return response so we can view in inngest dashboard
    //TODO: allow no campaign contract if all donations are anyonecanpay pledges
    //TODO: check that we're not overcommitting if version > 2
    // can use inngest to process one-by-one and reject annyonecanpay and refund pledge
    if (campaign.fulfillmentTimestamp) return
    if (totalPledged < campaign.amount) return

    //Complete campaign
    const electrumProvider = this.electrumProviderService.getElectrumProvider(
      campaign.network
    )

    const completedTx = await getCampaignContract(electrumProvider, {
      amount: campaign.amount,
      expires: campaign.expires,
      payoutAddress: campaign.address,
      network: campaign.network,
      version: campaign.version,
    }).complete(campaign.contract, anyonecanpayPledges)

    if (!completedTx) {
      throw new Error('Failed to complete campaign: ' + campaign.campaignId)
    }

    //Only save if campaign contract exists
    if (campaign.contract) {
      await campaignRepository.saveCampaignContract({
        campaignId: campaign.campaignId,
        parentTxId: campaign.contract.txid,
        categoryId: campaign.contract.categoryId,
        satoshis: BigInt(0),
        opts: {
          type: 'PAYOUT',
        },
        txid: completedTx.txid,
      })
    }

    //Save campaign
    await campaignRepository.saveCampaignComplete({
      txid: completedTx.txid,
      campaignId: campaign.campaignId,
    })

    this.onCampaignUpdate({
      campaignId: campaign.campaignId,
      satoshis: campaign.amount.toString(),
      fulfillmentTimestamp: moment().unix(),
      contributionCount: campaign.pledges,
    })

    //Should unsubscribe from donation and all anyonecanpay pledges for this campaign
    await Promise.all([
      this.addressWatcher.unsubscribe({
        id: campaign.campaignId,
        address: campaign.donationAddress,
        network: campaign.network,
      }),
      ...anyonecanpayPledges.map((pledge) =>
        this.addressWatcher.unsubscribe({
          id: pledge.pledgeId,
          address: pledge.address,
          network: campaign.network,
        })
      ),
    ])
  }
}
