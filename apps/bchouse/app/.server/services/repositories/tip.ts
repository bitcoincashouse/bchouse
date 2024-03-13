import { NoResultError } from 'kysely'
import { Network, db } from '../db'

export async function createTipRequest({
  invoiceId,
  postId,
  userId,
  network,
}: {
  invoiceId: string
  postId: string
  userId: string | null
  network: Network
}) {
  await db
    .insertInto('TipRequest')
    .values({
      id: invoiceId,
      postId,
      userId,
      //TODO: Remove network
      network,
    })
    .execute()
  return { id: invoiceId, network }
}

export async function getUnpaidTipRequest(params: { id: string }) {
  try {
    return await db
      .selectFrom('TipRequest as tr')
      .leftJoin('TipPayment as tp', 'tp.tipId', 'tr.id')
      .leftJoin('Post as p', 'p.id', 'tr.postId')
      .leftJoin('User as u', 'u.id', 'p.publishedById')
      .where((eb) => eb('tr.id', '=', params.id).and('tp.tipId', 'is', null))
      .select([
        'tr.id',
        'tr.postId',
        'tr.userId as tipperUserId',
        'tr.network',
        'u.bchAddress',
        'u.username',
        'u.firstName',
        'u.lastName',
        'p.publishedById as tippedUserId',
      ])
      .executeTakeFirstOrThrow()
      .then(({ firstName, lastName, ...row }) => ({
        ...row,
        displayName:
          [firstName, lastName].filter(Boolean).join(' ') || row.username,
      }))
  } catch (err) {
    if (err instanceof NoResultError) {
      throw new Error('Invalid or already paid invoice')
    }

    throw err
  }
}

export async function saveTipPayment({
  requestId,
  txid,
  vout,
  address,
  satoshis,
}: {
  requestId: string
  txid: string
  vout: number
  satoshis: bigint
  address: string
}) {
  await db
    .insertInto('TipPayment')
    .values({
      tipId: requestId,
      txid,
      vout,
      satoshis,
      address,
    })
    .execute()
}

export async function getTipPaymentById({ requestId }: { requestId: string }) {
  return db
    .selectFrom('TipPayment')
    .where('tipId', '=', requestId)
    .select(['tipId', 'txid', 'vout', 'createdAt', 'satoshis'])
    .executeTakeFirst()
}
