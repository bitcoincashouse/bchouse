import { sql } from 'kysely'
import { db } from '../../db'

export async function getCampaignDonorPosts({
  postId,
  currentUserId,
}: {
  postId: string
  currentUserId: string | null
}) {
  return db
    .selectFrom(
      db
        .selectFrom('CampaignContractSpendTransaction as ct')

        .innerJoin('PledgePayment as pp', 'pp.pledgeId', 'ct.pledgePaymentId')
        .innerJoin('PledgeRequest as pr', 'pr.id', 'ct.pledgePaymentId')

        .innerJoin('Campaign as c', 'c.id', 'pr.campaignId')
        .innerJoin('Post as p', 'p.campaignId', 'pr.campaignId')

        .leftJoin('User as co', 'co.id', 'pr.userId')

        //Get parent paymment
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
        .where((eb) =>
          eb
            .eb('p.id', '=', postId)

            //Hasn't been refunded
            .and(
              eb
                .eb('ctr.txid', 'is', null)
                .or('ctr.timestamp', '>=', sql<Date>`FROM_UNIXTIME(c.expires)`)
            )
        )
        .select([
          'pp.name as anonymousName',
          'pp.comment',
          'pp.createdAt',
          'co.username',
          'co.firstName',
          'co.lastName',
          'co.avatarUrl',
          sql<bigint>`ct.satoshis - COALESCE(ctp.satoshis, 0)`.as(
            'pledgeAmount'
          ),
        ])
        .union(
          db
            .selectFrom('AnyonecanpayPledge as pl')
            .innerJoin('Campaign as c', 'c.id', 'pl.campaignId')
            .innerJoin('Post as p', 'p.campaignId', 'pl.campaignId')
            .leftJoin('User as co', 'co.id', 'pl.userId')
            .where((eb) =>
              eb.eb('p.id', '=', postId).and(
                eb
                  .eb('pl.spentAt', 'is', null)
                  .or('pl.spentAt', '>=', sql<Date>`FROM_UNIXTIME(c.expires)`)
                  .or('pl.spentAt', '>=', eb.ref('c.payoutTxTimestamp'))
              )
            )
            .select([
              'pl.name as anonymousName',
              'pl.comment',
              'pl.createdAt',
              'co.username',
              'co.firstName',
              'co.lastName',
              'co.avatarUrl',
              'pl.satoshis as pledgeAmount',
            ])
        )
        .as('p')
    )
    .select([
      'p.anonymousName',
      'p.comment',
      'p.createdAt',
      'p.username',
      'p.firstName',
      'p.lastName',
      'p.avatarUrl',
      'p.pledgeAmount',
    ])
    .orderBy('pledgeAmount desc')
    .execute()
    .then((rows) => {
      return rows.map((row) => ({
        ...row,
        comment: (row.comment as string) || '',
      }))
    })
}
