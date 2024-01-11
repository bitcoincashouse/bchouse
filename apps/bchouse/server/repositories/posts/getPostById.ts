import { sql } from 'kysely'
import { jsonObjectFrom } from 'kysely/helpers/mysql'
import { CampaignSpendType, Network, db } from '../../db/index'
import moment from '../../utils/moment'
import { postRowMapper } from './mappers'
import { selectors } from './selectors'
import { KyselyPostDbModel } from './types'

export async function getPostById(params: {
  id: string
  currentUserId: string | null
}): Promise<
  KyselyPostDbModel & {
    monetization:
      | {
          campaignId: string
          address: string
          amount: number
          expires: number
          raised: number
          contributionCount: number
          fulfilllmentTxId?: string
          fulfillmentTimestamp?: number
          title: string
          network: Network
          donationAddress: string
          version: number
        }
      | undefined
  }
> {
  const { id, currentUserId } = params
  const post = await db
    .selectFrom('Post as post')
    .innerJoin('User as publishedBy', 'publishedBy.id', 'post.publishedById')
    .where('post.id', '=', id)
    .select([
      ...selectors.post.all,
      ...selectors.post.publishedBy,
      selectors.wasReposted(currentUserId),
      selectors.wasQuoted(currentUserId),
      selectors.wasLiked(currentUserId),
      selectors.wasTipped(currentUserId),
      selectors.mediaUrls,
      selectors.likes,
      selectors.quotePosts,
      selectors.comments,
      selectors.reposts,
      selectors.tipAmount,
      'post.deleted',
    ])
    .leftJoin('Post as parentPost', 'parentPost.id', 'post.parentPostId')
    .select('parentPost.publishedById as parentPostPublishedById')
    .leftJoin('Campaign as campaign', 'campaign.id', 'post.campaignId')
    .select([
      'campaign.address as campaignAddress',
      'campaign.satoshis as campaignGoal',
      'campaign.id as campaignId',
      'campaign.expires as campaignExpires',
      'campaign.title as campaignTitle',
      'campaign.refunded',
      'campaign.pledgedAmount',
      'campaign.network',
      'campaign.donationAddress',
      'campaign.version as campaignVersion',
      'campaign.payoutTxId',
      'campaign.payoutTxTimestamp',
      (eb) =>
        jsonObjectFrom(
          eb
            .selectFrom('CampaignContractSpendTransaction as ct')
            .where((eb) =>
              eb
                .eb('ct.campaignId', '=', eb.ref('campaign.id'))
                .and('ct.type', '=', CampaignSpendType.PAYOUT)
            )
            .select(['ct.timestamp', 'ct.txid'])
            .limit(1)
        ).as('fulfillment'),
      (eb) =>
        eb
          .selectFrom('CampaignContractSpendTransaction as ct')
          //Filter out ct's with a refund spend
          .leftJoin(
            'CampaignContractSpendTransaction as ctr',
            'ctr.pledgeRefundId',
            'ct.pledgePaymentId'
          )
          .where((eb) =>
            eb
              .eb('ct.campaignId', '=', eb.ref('campaign.id'))
              .and('ct.type', '=', CampaignSpendType.PLEDGE)
              //No refund transaction or refund occurred after expiration
              .and(
                eb
                  .eb('ctr.txid', 'is', null)
                  .or(
                    'ctr.timestamp',
                    '>',
                    sql<Date>`FROM_UNIXTIME(campaign.expires)`
                  )
              )
          )
          .select((eb) => eb.fn.count('ct.txid').as('pledges'))
          .as('pledges'),
      (eb) =>
        eb
          .selectFrom('CampaignContractSpendTransaction as ct')
          .where((eb) =>
            eb
              .eb('ct.campaignId', '=', eb.ref('campaign.id'))
              .and(
                'ct.timestamp',
                '<=',
                sql<Date>`FROM_UNIXTIME(campaign.expires)`
              )
          )
          .orderBy('ct.timestamp desc')
          .limit(1)
          .select(['ct.satoshis'])
          .as('campaignRaised'),
    ])
    .executeTakeFirst()

  if (!post) {
    throw new Error(`Post with id ${id} not found`)
  }

  const campaignId = post.campaignId
  const anyonecanpayPledges =
    campaignId !== null
      ? await db
          .selectFrom('AnyonecanpayPledge as ap')
          .innerJoin('Campaign as campaign', 'campaign.id', 'ap.campaignId')

          .where((eb) =>
            eb('campaignId', '=', campaignId).and(
              eb
                .eb('spentAt', 'is', null)
                .or('spentAt', '>=', sql<Date>`FROM_UNIXTIME(campaign.expires)`)
                .or('spentAt', '>=', eb.ref('campaign.payoutTxTimestamp'))
            )
          )
          .select(['ap.campaignId', 'ap.pledgeId', 'ap.satoshis'])
          .execute()
      : []

  //TODO: instead of filtering all, only filter pledges spent before campaign completed
  const totalAnyonecanpayPledgeAmount = anyonecanpayPledges.reduce(
    (s, p) => s + BigInt(p.satoshis),
    0n
  )

  return {
    ...postRowMapper(post),
    monetization:
      post.campaignAddress &&
      post.campaignGoal &&
      post.campaignExpires &&
      post.campaignId &&
      post.network
        ? {
            campaignId: post.campaignId,
            title: post.campaignTitle || '',
            amount: Number(post.campaignGoal),
            address: post.campaignAddress,
            expires: post.campaignExpires,
            network: post.network,
            raised: post.refunded
              ? Number(post?.pledgedAmount || 0)
              : post?.payoutTxId || post?.fulfillment?.txid
              ? Number(post.campaignGoal)
              : Number(post?.campaignRaised || 0) +
                Number(totalAnyonecanpayPledgeAmount),
            contributionCount:
              Number(post?.pledges || 0) + anyonecanpayPledges.length,
            fulfilllmentTxId: post?.payoutTxId || post?.fulfillment?.txid,
            fulfillmentTimestamp:
              post?.payoutTxTimestamp || post?.fulfillment?.timestamp
                ? moment(post?.fulfillment?.timestamp).unix()
                : undefined,
            donationAddress: post?.donationAddress || '',
            version: post?.campaignVersion || 0,
          }
        : undefined,
  }
}
