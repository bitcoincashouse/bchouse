import { Expression, NoResultError, SqlBool, sql } from 'kysely'
import { jsonObjectFrom } from 'kysely/helpers/mysql'
import { formatAddress } from '../../app/utils/bchUtils'
import { CampaignSpendType, Network, PledgeType, db } from '../db'

export async function getUnpaidPledgeRequest(params: { id: string }) {
  try {
    const {
      campaignId,
      id: pledgeRequestId,
      network,
      secret,
    } = await db
      .selectFrom('PledgeRequest')
      .leftJoin('PledgePayment', 'PledgePayment.pledgeId', 'PledgeRequest.id')
      .where((eb) =>
        eb('PledgeRequest.id', '=', params.id).and(
          'PledgePayment.pledgeId',
          'is',
          null
        )
      )
      .select(['id', 'campaignId', 'network', 'secret'])
      .executeTakeFirstOrThrow()

    return {
      pledgeRequestId,
      campaignId,
      network,
      secret,
    }
  } catch (err) {
    if (err instanceof NoResultError) {
      throw new Error('Invalid or already paid invoice')
    }

    throw err
  }
}

export async function getManyPledges(params: {
  userId?: string | null
  pledgeSecrets?: string[]
}) {
  if (!params.userId && !params.pledgeSecrets?.length) return []

  return await db
    .selectFrom('PledgePayment as pp')
    .innerJoin('PledgeRequest as pr', 'pr.id', 'pp.pledgeId')
    //Get pledge transaction
    .leftJoin(
      'CampaignContractSpendTransaction as ct',
      'ct.pledgePaymentId',
      'pr.id'
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
      'pr.id'
    )
    //Get pledge NFT output
    .leftJoin('CampaignNFT as nft', 'nft.txid', 'ct.txid')
    .where((eb) => {
      const predicates = [] as Expression<SqlBool>[]

      if (params.userId) {
        predicates.push(eb('pr.userId', '=', params.userId))
      }

      if (params.pledgeSecrets?.length) {
        predicates.push(eb('pr.secret', 'in', params.pledgeSecrets))
      }

      return eb.or(predicates)
    })
    .select([
      'pr.id',
      'pr.campaignId',
      'pr.network',
      'pr.secret',
      'pp.returnAddress',
      'pp.type',
      'pp.txid',
      'pp.vout',
      'pp.satoshis',
      (eb) =>
        jsonObjectFrom(
          eb
            .selectFrom('Post as po')
            .leftJoin('User as u', 'u.id', 'po.publishedById')
            .where('po.campaignId', '=', eb.ref('pr.campaignId'))
            .orderBy('po.createdAt')
            .limit(1)
            .select(['po.id', 'u.username'])
        ).as('post'),
      'ct.categoryId as forwardedCategoryId',
      'ct.txid as forwardedTxId',
      'nft.satoshis as forwardedSatoshis',
      sql<bigint>`ct.satoshis - COALESCE(ctp.satoshis, 0)`.as('pledgedAmount'),
      'ctr.txid as refundTxId',
      'pp.cancelTxId',
      (eb) =>
        eb
          .selectFrom('CampaignContractSpendTransaction as ct')
          .where((eb) =>
            eb
              .eb('ct.campaignId', '=', eb.ref('pr.campaignId'))
              .and('ct.type', '=', CampaignSpendType.PAYOUT)
          )
          .select(['ct.txid as fulfillmentTxId'])
          .limit(1)
          .as('fulfillmentTxId'),
    ])
    .orderBy('pp.createdAt desc')
    .execute()
    .then((rows) => {
      return rows.map(
        ({
          id: pledgeRequestId,
          returnAddress: refundAddress,
          satoshis,
          network,
          campaignId,
          txid,
          vout,
          type,
          post,
          forwardedTxId,
          forwardedSatoshis,
          pledgedAmount,
          forwardedCategoryId,
          refundTxId,
          cancelTxId,
          fulfillmentTxId,
          secret,
        }) => {
          return {
            pledgeRequestId,
            campaignId,
            forwardTx: forwardedTxId
              ? {
                  satoshis: BigInt(forwardedSatoshis as bigint),
                  pledgedAmount: BigInt(pledgedAmount as bigint),
                  txid: forwardedTxId as string,
                  categoryId: forwardedCategoryId as string,
                  vout: 1,
                }
              : null,
            refundTxId: refundTxId || cancelTxId,
            refundAddress: formatAddress(network, refundAddress),
            network,
            satoshis: BigInt(satoshis),
            txid: txid,
            vout: vout,
            type,
            postId: post?.id as string,
            campaignOrganizer: post?.username as string,
            fulfillmentTxId,
            secret,
          }
        }
      )
    })
}

export async function getCurrentPledgeTransactionBySecret(params: {
  secret: string
}) {
  const {
    id: pledgeRequestId,
    returnAddress: refundAddress,
    satoshis,
    network,
    campaignId,
    txid,
    vout,
    type,
    post,
    forwardedTxId,
    forwardedSatoshis,
    pledgedAmount,
    forwardedCategoryId,
    refundTxId,
    cancelTxId,
    fulfillmentTxId,
  } = await db
    .selectFrom('PledgePayment as pp')
    .innerJoin('PledgeRequest as pr', 'pr.id', 'pp.pledgeId')
    //Get pledge transaction
    .leftJoin(
      'CampaignContractSpendTransaction as ct',
      'ct.pledgePaymentId',
      'pr.id'
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
      'pr.id'
    )
    //Get pledge NFT output
    .leftJoin('CampaignNFT as nft', 'nft.txid', 'ct.txid')
    .where((eb) => eb.eb('pr.secret', '=', params.secret))
    .select([
      'pr.id',
      'pr.campaignId',
      'pr.network',
      'pp.returnAddress',
      'pp.type',
      'pp.txid',
      'pp.vout',
      'pp.satoshis',
      (eb) =>
        jsonObjectFrom(
          eb
            .selectFrom('Post as po')
            .leftJoin('User as u', 'u.id', 'po.publishedById')
            .where('po.campaignId', '=', eb.ref('pr.campaignId'))
            .orderBy('po.createdAt')
            .limit(1)
            .select(['po.id', 'u.username'])
        ).as('post'),
      'ct.categoryId as forwardedCategoryId',
      'ct.txid as forwardedTxId',
      'nft.satoshis as forwardedSatoshis',
      sql<bigint>`ct.satoshis - COALESCE(ctp.satoshis, 0)`.as('pledgedAmount'),
      'ctr.txid as refundTxId',
      'pp.cancelTxId',
      (eb) =>
        eb
          .selectFrom('CampaignContractSpendTransaction as ct')
          .where((eb) =>
            eb
              .eb('ct.campaignId', '=', eb.ref('pr.campaignId'))
              .and('ct.type', '=', CampaignSpendType.PAYOUT)
          )
          .select(['ct.txid as fulfillmentTxId'])
          .limit(1)
          .as('fulfillmentTxId'),
    ])
    .executeTakeFirstOrThrow()

  return {
    pledgeRequestId,
    campaignId,
    forwardTx: forwardedTxId
      ? {
          satoshis: BigInt(forwardedSatoshis as bigint),
          pledgedAmount: BigInt(pledgedAmount as bigint),
          txid: forwardedTxId as string,
          categoryId: forwardedCategoryId as string,
          vout: 1,
        }
      : null,
    refundTxId: refundTxId || cancelTxId,
    refundAddress: formatAddress(network, refundAddress),
    network,
    satoshis: BigInt(satoshis),
    txid: txid,
    vout: vout,
    type,
    postId: post?.id as string,
    campaignOrganizer: post?.username as string,
    fulfillmentTxId,
  }
}

export async function getPledgePaymentByRequestId(params: { id: string }) {
  const payment = await db
    .selectFrom('PledgePayment as pp')
    .innerJoin('PledgeRequest as pr', 'pr.id', 'pp.pledgeId')
    .where('pr.id', '=', params.id)
    .select([
      'id',
      'returnAddress',
      'satoshis',
      'campaignId',
      'txid',
      'vout',
      'type',
    ])
    .executeTakeFirst()

  return payment
    ? {
        pledgeRequestId: payment.id,
        campaignId: payment.campaignId,
        refundAddress: payment.returnAddress,
        pledgeAmount: payment.satoshis,
        txid: payment.txid,
        vout: payment.vout,
        type: payment.type,
      }
    : undefined
}

export async function savePledgePayment({
  pledgeRequestId,
  txid,
  vout,
  returnAddress,
  address,
  satoshis,
  type,
}: {
  pledgeRequestId: string
  txid: string
  vout: number
  returnAddress: string
  satoshis: bigint
  address: string
  type: PledgeType
}) {
  await db
    .insertInto('PledgePayment')
    .values({
      pledgeId: pledgeRequestId,
      txid,
      vout,
      returnAddress,
      satoshis,
      address,
      type,
    })
    .execute()
}

export async function saveForwardedPledge({
  pledgeRequestId,
  txid,
  vout,
  satoshis,
}: {
  pledgeRequestId: string
  txid: string
  vout: number
  satoshis: bigint
}) {
  await db
    .updateTable('PledgePayment')
    .where('PledgePayment.pledgeId', '=', pledgeRequestId)
    .set({
      txid,
      vout,
      satoshis,
    })
    .execute()
}

export async function saveCancelledPledge({
  pledgeRequestId,
  cancelTxId,
}: {
  pledgeRequestId: string
  cancelTxId?: string
}) {
  await db
    .updateTable('PledgePayment')
    .where('PledgePayment.pledgeId', '=', pledgeRequestId)
    .set({
      cancelTxId,
    })
    .execute()
}

export async function createPledgeRequest({
  campaignId,
  userId,
  network,
  secret,
  requestId,
}: {
  campaignId: string
  userId: string | null
  network: Network
  secret: string
  requestId: string
}) {
  await db
    .insertInto('PledgeRequest')
    .values({
      id: requestId,
      campaignId,
      userId,
      //TODO: Remove network
      network,
      secret,
    })
    .execute()
  return { id: requestId, network, secret }
}

export async function getAnyonecanpayPledge(
  campaignId: string,
  txHash: string,
  txIndex: number
) {
  return db
    .selectFrom('AnyonecanpayPledge as pl')
    .innerJoin('Campaign as campaign', 'campaign.id', 'pl.campaignId')
    .where((eb) =>
      eb('campaignId', '=', campaignId)
        .and('txid', '=', txHash)
        .and('vout', '=', txIndex)
        .and(
          eb
            .eb('spentAt', 'is', null)
            .or('spentAt', '>=', sql<Date>`FROM_UNIXTIME(campaign.expires)`)
            .or('spentAt', '>=', eb.ref('campaign.payoutTxTimestamp'))
        )
    )
    .select(['pl.campaignId', 'pl.pledgeId', 'pl.satoshis'])
    .executeTakeFirst()
}

export async function getAnyonecanpayPledges(campaignId: string) {
  return db
    .selectFrom('AnyonecanpayPledge as pl')
    .innerJoin('Campaign as campaign', 'campaign.id', 'pl.campaignId')
    .where((eb) =>
      eb('campaignId', '=', campaignId).and(
        eb
          .eb('spentAt', 'is', null)
          .or('spentAt', '>=', sql<Date>`FROM_UNIXTIME(campaign.expires)`)
          .or('spentAt', '>=', eb.ref('campaign.payoutTxTimestamp'))
      )
    )
    .select(['pl.campaignId', 'pl.pledgeId', 'pl.satoshis'])
    .execute()
}

export async function getAnyonecanpayPledgesComplete(campaignId: string) {
  return db
    .selectFrom('AnyonecanpayPledge as pl')
    .innerJoin('Campaign as campaign', 'campaign.id', 'pl.campaignId')
    .where((eb) =>
      eb('campaignId', '=', campaignId).and(
        eb
          .eb('spentAt', 'is', null)
          .or('spentAt', '>=', sql<Date>`FROM_UNIXTIME(campaign.expires)`)
          .or('spentAt', '>=', eb.ref('campaign.payoutTxTimestamp'))
      )
    )
    .select([
      'pl.campaignId',
      'pl.pledgeId',
      'pl.satoshis',
      'pl.lockingScript',
      'pl.address',
      'pl.unlockingScript',
      'pl.seqNum',
      'pl.txid',
      'pl.vout',
    ])
    .execute()
}

export async function saveAnyonecanpayPledge(pledge: {
  pledgeId: string
  campaignId: string
  userId?: string | null
  comment?: string
  name?: string
  txid: string
  vout: number
  satoshis: bigint
  lockingScript: string
  unlockingScript: string
  address: string
}) {
  await db
    .insertInto('AnyonecanpayPledge')
    .values({
      pledgeId: pledge.pledgeId,
      campaignId: pledge.campaignId,
      comment: pledge.comment,
      name: pledge.name,
      userId: pledge.userId,
      txid: pledge.txid,
      vout: pledge.vout,
      satoshis: pledge.satoshis,
      lockingScript: pledge.lockingScript,
      unlockingScript: pledge.unlockingScript,
      address: pledge.address,
      seqNum: BigInt(0xffffffff),
    })
    .onDuplicateKeyUpdate({
      pledgeId: pledge.pledgeId,
      campaignId: pledge.campaignId,
      comment: pledge.comment,
      name: pledge.name,
      userId: pledge.userId,
      txid: pledge.txid,
      vout: pledge.vout,
      satoshis: pledge.satoshis,
      lockingScript: pledge.lockingScript,
      unlockingScript: pledge.unlockingScript,
      address: pledge.address,
      seqNum: BigInt(0xffffffff),
    })
    .execute()

  return { id: pledge.pledgeId }
}

export async function saveAnyonecanpayPledgeSpent(pledgeId: string) {
  await db
    .updateTable('AnyonecanpayPledge')
    .where('pledgeId', '=', pledgeId)
    .set({
      spentAt: new Date(),
    })
    .execute()
}

export async function getUiContributions(campaignId: string) {
  const getSmartContractContributions = () =>
    db
      .selectFrom('CampaignContractSpendTransaction as ct')
      .innerJoin('Campaign as c', 'c.id', 'ct.campaignId')
      .innerJoin('PledgePayment as pp', 'pp.pledgeId', 'ct.pledgePaymentId')
      .innerJoin('PledgeRequest as pr', 'pr.id', 'pp.pledgeId')
      .leftJoin('User as co', 'co.id', 'pr.userId')
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
        'pr.id'
      )
      //Get pledge NFT output
      .leftJoin('CampaignNFT as nft', 'nft.txid', 'ct.txid')
      .where((eb) =>
        eb('pr.campaignId', '=', campaignId).and(
          //No refund or refunded after expiration
          eb
            .eb('ctr.txid', 'is', null)
            .or('ctr.timestamp', '>=', sql<Date>`FROM_UNIXTIME(c.expires)`)
        )
      )
      .select([
        'pr.userId',
        'pp.name as anonymousName',
        'pp.pledgeId as pledgeRequestId',
        sql<bigint>`ct.satoshis - COALESCE(ctp.satoshis, 0)`.as('satoshis'),
        'pp.createdAt',
        'co.username',
        'co.firstName',
        'co.lastName',
        'co.avatarUrl',
      ])

  const getAnyonecanpayContributions = () =>
    db
      .selectFrom('AnyonecanpayPledge as p')
      .leftJoin('User as co', 'co.id', 'p.userId')
      .innerJoin('Campaign as campaign', 'campaign.id', 'p.campaignId')
      .where((eb) =>
        eb('campaignId', '=', campaignId).and(
          eb
            .eb('spentAt', 'is', null)
            .or('spentAt', '>=', sql<Date>`FROM_UNIXTIME(campaign.expires)`)
            .or('spentAt', '>=', eb.ref('campaign.payoutTxTimestamp'))
        )
      )
      .select([
        'p.userId',
        'p.name as anonymousName',
        'p.pledgeId as pledgeRequestId',
        'p.satoshis',
        'p.createdAt',
        'co.username',
        'co.firstName',
        'co.lastName',
        'co.avatarUrl',
      ])

  const getContributions = () =>
    db
      .selectFrom(
        getSmartContractContributions()
          .union(getAnyonecanpayContributions())
          .as('p')
      )
      .select([
        'p.userId',
        'p.anonymousName',
        'p.pledgeRequestId',
        'p.satoshis',
        'p.createdAt',
        'p.username',
        'p.firstName',
        'p.lastName',
        'p.avatarUrl',
      ])

  const [firstContribution, latestContribution, topContribution] =
    await Promise.all([
      getContributions().orderBy('p.createdAt asc').limit(1).executeTakeFirst(),
      getContributions()
        .orderBy('p.createdAt desc')
        .limit(1)
        .executeTakeFirst(),
      getContributions().orderBy('satoshis desc').limit(1).executeTakeFirst(),
    ])

  const isTopUnique =
    topContribution?.pledgeRequestId !== firstContribution?.pledgeRequestId
  const isLatestUnique =
    latestContribution?.pledgeRequestId !==
      firstContribution?.pledgeRequestId &&
    latestContribution?.pledgeRequestId !== topContribution?.pledgeRequestId

  return {
    firstContribution,
    topContribution: isTopUnique ? topContribution : null,
    latestContribution: isLatestUnique ? latestContribution : null,
  }
}

export async function getAllContributions(campaignId: string) {
  return db
    .selectFrom(
      db
        .selectFrom('CampaignContractSpendTransaction as ct')
        .innerJoin('Campaign as c', 'c.id', 'ct.campaignId')
        .innerJoin('PledgePayment as pp', 'pp.pledgeId', 'ct.pledgePaymentId')
        .innerJoin('PledgeRequest as pr', 'pr.id', 'pp.pledgeId')
        .leftJoin('User as co', 'co.id', 'pr.userId')
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
          'pr.id'
        )
        //Get pledge NFT output
        .leftJoin('CampaignNFT as nft', 'nft.txid', 'ct.txid')
        .where('pr.campaignId', '=', campaignId)
        .select([
          'pr.userId',
          'co.username',
          'co.firstName',
          'co.lastName',
          'pp.name as anonymousName',
          'co.avatarUrl',
          'pp.pledgeId as pledgeRequestId',
          sql<bigint>`ct.satoshis - COALESCE(ctp.satoshis, 0)`.as('satoshis'),
          'pp.createdAt',
          //No refund or refunded after expiration
          (eb) => eb('ctr.txid', 'is not', null).as('refunded'),
          'ctr.timestamp as refundedAt',
        ])
        .union(
          db
            .selectFrom('AnyonecanpayPledge as p')
            .leftJoin('User as co', 'co.id', 'p.userId')
            .where((eb) => eb('campaignId', '=', campaignId))
            .select([
              'p.userId',
              'co.username',
              'co.firstName',
              'co.lastName',
              'p.name as anonymousName',
              'co.avatarUrl',
              'p.pledgeId as pledgeRequestId',
              'p.satoshis',
              'p.createdAt',
              (eb) => eb('p.spentAt', 'is not', null).as('refunded'),
              'p.spentAt as refundedAt',
            ])
        )
        .as('p')
    )
    .select([
      'p.userId',
      'p.username',
      'p.firstName',
      'p.lastName',
      'p.anonymousName',
      'p.avatarUrl',
      'p.pledgeRequestId',
      'p.satoshis',
      'p.createdAt',
      'p.refunded',
      'p.refundedAt',
    ])
    .execute()
}
