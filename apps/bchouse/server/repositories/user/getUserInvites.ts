import { nanoid } from 'nanoid'
import { v4 } from 'uuid'
import { db } from '../../db/index.js'

export async function createInviteCode(params: { userId: string }) {
  const code = nanoid()

  await db
    .insertInto('InviteCode')
    .values({
      id: v4(),
      code,
      userId: params.userId,
    })
    .execute()

  return code
}

export async function getUserInviteCodes(params: { userId: string }) {
  return await db
    .selectFrom('InviteCode as i')
    .innerJoin('User as user', 'user.id', 'i.userId')
    .where('userId', '=', params.userId)
    .select(['code', 'claimedEmailAddress', 'i.createdAt'])
    .orderBy(['createdAt desc'])
    .execute()
}

export async function getInviteCode(params: { code: string }) {
  return await db
    .selectFrom('InviteCode as i')
    .innerJoin('User as u', 'u.id', 'i.userId')
    .where('code', '=', params.code)
    .select([
      'code',
      'u.username',
      'u.firstName',
      'u.lastName',
      'claimedEmailAddress',
    ])
    .executeTakeFirst()
    .then((row) =>
      row
        ? {
            code: row.code,
            claimedEmailAddress: row.claimedEmailAddress,
            name:
              [row.firstName, row.lastName].filter(Boolean).join(' ') ||
              row.username,
          }
        : null
    )
}

export async function getUserInviteCodeCount(params: { userId: string }) {
  return await db
    .selectFrom('InviteCode as i')
    .where('userId', '=', params.userId)
    .select([(eb) => eb.fn.count('i.id').as('inviteCount')])
    .executeTakeFirst()
    .then((result) => Number(result?.inviteCount || 0))
}

export async function updateInvitedCode(params: {
  code: string
  emailAddress: string
}) {
  const id = v4()
  await db
    .updateTable('InviteCode')
    .where('code', '=', params.code)
    .set({
      claimedEmailAddress: params.emailAddress,
    })
    .execute()

  return id
}

export async function getUserInviteCount(params: { userId: string }) {
  return await db
    .selectFrom('Invite as i')
    .innerJoin('User as user', 'user.id', 'i.userId')
    .where('userId', '=', params.userId)
    .groupBy('userId')
    .select([
      (eb) => eb.fn.count('i.id').as('inviteCount'),
      '__isAdmin as isAdmin',
    ])
    .executeTakeFirst()
    .then((result) => (result?.isAdmin ? 0 : Number(result?.inviteCount || 0)))
}

export async function addUserInvite(params: {
  userId: string
  emailAddress: string
}) {
  const id = v4()
  await db
    .insertInto('Invite')
    .values({
      id,
      userId: params.userId,
      emailAddress: params.emailAddress,
    })
    .execute()

  return id
}
