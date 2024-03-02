import { Expression, SqlBool, sql } from 'kysely'
import { jsonObjectFrom } from 'kysely/helpers/mysql'
import { z } from 'zod'
import { formatAddress } from '../../app/utils/bchUtils'
import moment from '../../app/utils/moment'
import { CampaignSpendType, Network, db } from '../db'

export async function getCampaignRefundablePledges(campaignId: string) {
  //TODO: Technically, can fetch pledges even if campaign completed
  // As long as the pledge expiration passed
  const results = await db
    .selectFrom('PledgeRequest as pr')
    .innerJoin('PledgePayment as pp', 'pp.pledgeId', 'pr.id')
    //Get pledge transaction
    .innerJoin(
      'CampaignContractSpendTransaction as ct',
      'ct.pledgePaymentId',
      'pp.pledgeId'
    )
    //Get parent transaction
    .leftJoin(
      'CampaignContractSpendTransaction as ctp',
      'ctp.txid',
      'ct.parentTxId'
    )
    //Get refund transaction
    .leftJoin(
      'CampaignContractSpendTransaction as ctr',
      'ctr.pledgeRefundId',
      'pp.pledgeId'
    )
    .where((eb) =>
      eb
        //Pledge is for campaignId
        .eb('pr.campaignId', '=', campaignId)
        //Pledge wasn't refunded
        .and('ctr.txid', 'is', null)
        .and('pp.cancelTxId', 'is', null)
    )
    .orderBy('pr.createdAt desc')
    .select([
      'pr.id as pledgeRequestId',
      'pr.campaignId',
      'pp.txid',
      'pp.type',
      'pp.vout',
      'pp.satoshis',
      'pp.returnAddress',
      'ct.txid as forwardTxId',
      'ct.satoshis as forwardSatoshis',
      'ct.categoryId',
      sql<bigint>`ct.satoshis - COALESCE(ctp.satoshis, 0)`.as('pledgedAmount'),
    ])
    .execute()

  return results.map((r) => ({
    ...r,
    satoshis: BigInt(r.satoshis),
    pledgedAmount: BigInt(r.pledgedAmount),
    forwardSatoshis: BigInt(r.forwardSatoshis),
  }))
}

export async function getRefundableCampaigns() {
  return db
    .selectFrom('Campaign as c')
    .leftJoin(
      (eb) =>
        eb
          .selectFrom('CampaignContractSpendTransaction as ct')
          .select([
            'ct.campaignId',
            (eb) => eb.fn.max('ct.timestamp').as('latestTimestamp'),
          ])
          .groupBy('ct.campaignId')
          .as('latest'),
      (join) => join.onRef('latest.campaignId', '=', 'c.id')
    )
    .leftJoin(
      'CampaignContractSpendTransaction as ct',
      'ct.timestamp',
      'latest.latestTimestamp'
    )
    .where((eb) =>
      eb
        //Campaign expired
        .eb('c.expires', '<=', moment().unix())
        //Last campaign contract transaction isn't payout (already completed)
        .and('c.refunded', '=', 0)
        //Contract balance is less than goal
        .and('ct.satoshis', '<', eb.ref('c.satoshis'))
        //Fully refunded contracts have a balance of 1000SATS
        .and('ct.satoshis', '>', BigInt(1000))
    )
    .select(['c.id'])
    .execute()
}

export async function getCompletableCampaigns() {
  return db
    .selectFrom('Campaign as c')
    .leftJoin(
      (eb) =>
        eb
          .selectFrom('CampaignContractSpendTransaction as ct')
          .select([
            'ct.campaignId',
            (eb) => eb.fn.max('ct.timestamp').as('latestTimestamp'),
          ])
          .groupBy('ct.campaignId')
          .as('latest'),
      (join) => join.onRef('latest.campaignId', '=', 'c.id')
    )
    .leftJoin(
      'CampaignContractSpendTransaction as ct',
      'ct.timestamp',
      'latest.latestTimestamp'
    )
    .where((eb) =>
      //expired campaign, no fufillment tx, and less than goal
      eb
        //Campaign not expired
        .eb('c.expires', '>', moment().unix())
        //Last campaign contract transaction isn't payout (already completed)
        .and('ct.type', '<>', CampaignSpendType.PAYOUT)
        //Contract balance is greater than goal
        .and('ct.satoshis', '>=', eb.ref('c.satoshis'))
    )
    .select(['c.id', 'c.satoshis'])
    .execute()
}

export async function getActiveCampaigns({
  limit = 5,
  username,
}: {
  limit: number
  username?: string
}) {
  return db
    .selectFrom('Campaign as c')
    .innerJoin('User as u', 'u.id', 'c.campaignerId')
    .innerJoin('Post as p', 'p.campaignId', 'c.id')
    .leftJoin(
      (eb) =>
        eb
          .selectFrom('CampaignContractSpendTransaction as ct')
          .select([
            'ct.campaignId',
            (eb) => eb.fn.max('ct.timestamp').as('latestTimestamp'),
          ])
          .groupBy('ct.campaignId')
          .as('latest'),
      (join) => join.onRef('latest.campaignId', '=', 'c.id')
    )
    .leftJoin(
      'CampaignContractSpendTransaction as ct',
      'ct.timestamp',
      'latest.latestTimestamp'
    )
    .where((eb) => {
      //expired campaign, no fufillment tx, and less than goal
      const predicates = [
        //Campaign not expired
        eb('c.expires', '>', moment().unix()),
        //Contract balance is less than goal
        eb('ct.type', '!=', CampaignSpendType.PAYOUT).or('ct.type', 'is', null),
        eb('c.payoutTxId', 'is', null),
        eb('p.deleted', '!=', 1),
      ] as Expression<SqlBool>[]

      if (typeof username === 'string') {
        predicates.push(eb('u.username', '=', username))
      }

      return eb.and(predicates)
    })
    .select([
      'c.id',
      'c.title',
      'c.expires',
      'c.satoshis as goal',
      'ct.satoshis as raised',
      (eb) =>
        eb
          .selectFrom('AnyonecanpayPledge as pl')
          .where((eb) =>
            eb('campaignId', '=', eb.ref('c.id')).and('spentAt', 'is', null)
          )
          .select((eb) => eb.fn.sum('satoshis').as('raisedPledges'))
          .as('raisedPledges'),
      'u.username',
      'p.id as statusId',
      (eb) =>
        eb
          .selectFrom(
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
                  .eb('ct.campaignId', '=', eb.ref('c.id'))
                  .and('ct.type', '=', CampaignSpendType.PLEDGE)
                  .and('ctr.txid', 'is', null)
              )
              .select(['ct.txid'])
              .union(
                eb
                  .selectFrom('AnyonecanpayPledge as pl')
                  .where((eb) =>
                    eb('campaignId', '=', eb.ref('c.id')).and(
                      eb
                        .eb('spentAt', 'is', null)
                        .or(
                          'spentAt',
                          '>=',
                          sql<Date>`FROM_UNIXTIME(c.expires)`
                        )
                        .or('spentAt', '>=', eb.ref('c.payoutTxTimestamp'))
                    )
                  )
                  .select(['pl.txid'])
              )
              .as('pledge')
          )
          .select((eb) => eb.fn.count('pledge.txid').as('pledges'))
          .as('pledges'),
    ])
    .orderBy(['pledges desc', 'c.createdAt desc'])
    .limit(limit)
    .execute()
    .then((rows) =>
      rows.map((row) => ({
        ...row,
        raised: BigInt(row.raised || 0) + BigInt(row.raisedPledges || 0),
      }))
    )
}

export async function getCampaignByIdWithPledges(params: {
  id: string
}): Promise<{
  campaignId: string
  address: string
  amount: bigint
  expires: number
  version: number
  network: Network
  campaignerId: string
  campaignerUsername: string
  donationAddress: string
  pledges: number
  fulfillmentTxId?: string
  fulfillmentTimestamp?: Date
  contract: {
    txid: string
    vout: number
    categoryId: string
    satoshis: bigint
  } | null
}> {
  const { id } = params
  const campaign = await db
    .selectFrom('Campaign as campaign')
    .innerJoin('User as campaigner', 'campaigner.id', 'campaign.campaignerId')
    .where('campaign.id', '=', id)
    .select([
      'campaign.address',
      'campaign.satoshis as amount',
      'campaign.id',
      'campaign.expires',
      'campaign.network',
      'campaign.campaignerId',
      'campaign.donationAddress',
      'campaign.version',
      'campaigner.username as campaignerUsername',
      'campaign.payoutTxId',
      'campaign.payoutTxTimestamp',
      (eb) =>
        jsonObjectFrom(
          eb
            .selectFrom('CampaignContractSpendTransaction as ct')
            .where('ct.campaignId', '=', eb.ref('campaign.id'))
            .select([
              'ct.timestamp',
              'ct.txid',
              'ct.categoryId',
              'ct.type',
              'ct.satoshis',
            ])
            .orderBy('ct.timestamp desc')
            .limit(1)
        ).as('campaignContract'),
      (eb) =>
        eb
          .selectFrom('AnyonecanpayPledge as ap')
          .where((eb) =>
            eb('campaignId', '=', eb.ref('campaign.id')).and(
              eb
                .eb('spentAt', 'is', null)
                .or('spentAt', '>=', sql<Date>`FROM_UNIXTIME(campaign.expires)`)
                .or('spentAt', '>=', eb.ref('campaign.payoutTxTimestamp'))
            )
          )
          .select((eb) => eb.fn.count('ap.txid').as('anyonecanpayPledges'))
          .as('anyonecanpayPledges'),
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
              .and('ctr.txid', 'is', null)
          )
          .select((eb) => eb.fn.count('ct.txid').as('pledges'))
          .as('pledges'),
    ])
    .executeTakeFirstOrThrow()

  return {
    campaignId: campaign.id,
    version: campaign.version,
    amount: campaign.amount,
    address: formatAddress(campaign.network, campaign.address),
    expires: campaign.expires,
    network: campaign.network,
    campaignerId: campaign.campaignerId,
    campaignerUsername: campaign.campaignerUsername,
    donationAddress: campaign.donationAddress,
    pledges:
      Number(campaign.pledges || 0) + Number(campaign.anyonecanpayPledges || 0),
    fulfillmentTxId:
      campaign.payoutTxId ||
      (campaign.campaignContract?.type === CampaignSpendType.PAYOUT
        ? campaign.campaignContract.txid
        : undefined),
    fulfillmentTimestamp:
      campaign.payoutTxTimestamp ||
      (campaign.campaignContract?.type === CampaignSpendType.PAYOUT
        ? campaign.campaignContract.timestamp
        : undefined),
    contract: campaign.campaignContract
      ? {
          categoryId: campaign.campaignContract.categoryId,
          txid: campaign.campaignContract.txid as string,
          vout: 0,
          satoshis: BigInt(campaign.campaignContract.satoshis as bigint),
        }
      : null,
  }
}

export async function getCampaignById(params: { id: string }): Promise<{
  campaignId: string
  address: string
  amount: bigint
  expires: number
  network: Network
  version: number
  campaignerId: string
  campaignerUsername: string
  donationAddress: string
  contract: {
    txid: string
    vout: number
    categoryId: string
    satoshis: bigint
  } | null
}> {
  const { id } = params
  const campaign = await db
    .selectFrom('Campaign as campaign')
    .innerJoin('User as campaigner', 'campaigner.id', 'campaign.campaignerId')
    .where('campaign.id', '=', id)
    .select([
      'campaign.address',
      'campaign.satoshis as amount',
      'campaign.id',
      'campaign.expires',
      'campaign.network',
      'campaign.version',
      'campaign.campaignerId',
      'campaigner.username as campaignerUsername',
      'campaign.donationAddress',
      (eb) =>
        jsonObjectFrom(
          eb
            .selectFrom('CampaignContractSpendTransaction as ct')
            .where('ct.campaignId', '=', eb.ref('campaign.id'))
            .select([
              'ct.categoryId',
              'ct.txid',
              'ct.satoshis',
              'ct.timestamp',
              'ct.type',
            ])
            .orderBy('ct.timestamp desc')
            .limit(1)
        ).as('campaignContract'),
    ])
    .executeTakeFirstOrThrow()

  return {
    campaignId: campaign.id,
    amount: campaign.amount,
    address: formatAddress(campaign.network, campaign.address),
    expires: campaign.expires,
    network: campaign.network,
    version: campaign.version,
    campaignerId: campaign.campaignerId,
    campaignerUsername: campaign.campaignerUsername,
    donationAddress: campaign.donationAddress,
    contract: campaign.campaignContract
      ? {
          categoryId: campaign.campaignContract.categoryId,
          txid: campaign.campaignContract.txid as string,
          vout: 0,
          satoshis: BigInt(campaign.campaignContract.satoshis),
        }
      : null,
  }
}

export async function getCampaignByDonationAddress(params: {
  address: string
}): Promise<{
  campaignId: string
  address: string
  amount: bigint
  expires: number
  network: Network
  campaignerId: string
  campaignerUsername: string
  donationAddress: string
  version: number
  contract: {
    txid: string
    vout: number
    categoryId: string
    satoshis: bigint
  } | null
}> {
  const campaign = await db
    .selectFrom('Campaign as campaign')
    .innerJoin('User as campaigner', 'campaigner.id', 'campaign.campaignerId')
    .where('campaign.donationAddress', '=', params.address)
    .select([
      'campaign.address',
      'campaign.satoshis as amount',
      'campaign.id',
      'campaign.expires',
      'campaign.network',
      'campaign.campaignerId',
      'campaigner.username as campaignerUsername',
      'campaign.donationAddress',
      'campaign.version',
      (eb) =>
        jsonObjectFrom(
          eb
            .selectFrom('CampaignContractSpendTransaction as ct')
            .where('ct.campaignId', '=', eb.ref('campaign.id'))
            .select([
              'ct.categoryId',
              'ct.txid',
              'ct.satoshis',
              'ct.timestamp',
              'ct.type',
            ])
            .orderBy('ct.timestamp desc')
            .limit(1)
        ).as('campaignContract'),
    ])
    .executeTakeFirstOrThrow()

  return {
    campaignId: campaign.id,
    amount: campaign.amount,
    address: formatAddress(campaign.network, campaign.address),
    expires: campaign.expires,
    network: campaign.network,
    campaignerId: campaign.campaignerId,
    campaignerUsername: campaign.campaignerUsername,
    donationAddress: campaign.donationAddress,
    version: Number(campaign.version),
    contract: campaign.campaignContract
      ? {
          categoryId: campaign.campaignContract.categoryId,
          txid: campaign.campaignContract.txid as string,
          vout: 0,
          satoshis: BigInt(campaign.campaignContract.satoshis),
        }
      : null,
  }
}

const saveCampaignContractSchema = z.object({
  parentTxId: z.string().optional(),
  campaignId: z.string(),
  categoryId: z.string(),
  txid: z.string(),
  satoshis: z.bigint(),
  opts: z
    .object({
      type: z.literal('PLEDGE'),
      pledgePaymentId: z.string(),
      nftOutput: z.object({
        satoshis: z.bigint(),
      }),
    })
    .or(
      z.object({
        type: z.literal('REFUND'),
        pledgeRefundId: z.string(),
      })
    )
    .or(
      z.object({
        type: z.enum(['START', 'FORWARD', 'PAYOUT']),
      })
    ),
})

type SaveCampaignContractParams = z.infer<typeof saveCampaignContractSchema>

export async function saveCampaignComplete({
  txid,
  campaignId,
}: {
  txid: string
  campaignId: string
}) {
  await db
    .updateTable('Campaign')
    .where('id', '=', campaignId)
    .set({
      payoutTxId: txid,
      payoutTxTimestamp: new Date(),
    })
    .execute()
}

export async function saveCampaignContract({
  parentTxId,
  campaignId,
  categoryId,
  txid,
  satoshis,
  opts,
}: SaveCampaignContractParams) {
  await db.transaction().execute(async (trx) => {
    await trx
      .insertInto('CampaignContractSpendTransaction')
      .values({
        parentTxId,
        campaignId,
        categoryId,
        txid,
        satoshis,
        type: opts.type,
        pledgePaymentId:
          opts.type === 'PLEDGE' ? opts.pledgePaymentId : undefined,
        pledgeRefundId:
          opts.type === 'REFUND' ? opts.pledgeRefundId : undefined,
      })
      .execute()

    if (opts.type === 'PLEDGE') {
      await trx
        .insertInto('CampaignNFT')
        .values({
          satoshis: opts.nftOutput.satoshis,
          txid,
        })
        .execute()
    }

    if (opts.type === 'REFUND') {
      await trx
        .updateTable('PledgePayment')
        .where('PledgePayment.pledgeId', '=', opts.pledgeRefundId)
        .set({
          cancelTxId: txid,
        })
        .execute()
    }
  })
}
export async function saveCampaignRefunded({
  campaignId,
  pledgedAmount,
}: {
  campaignId: string
  pledgedAmount?: bigint
}) {
  await db
    .updateTable('Campaign')
    .where('Campaign.id', '=', campaignId)
    .set({
      refunded: 1,
      pledgedAmount,
    })
    .execute()
}
