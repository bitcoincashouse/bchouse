import { moment } from '@bchouse/utils'
import { db } from '~/server/services/db'

export async function updateUserLastActive({ id }: { id: string }) {
  await db
    .updateTable('User')
    .where('id', '=', id)
    .set({
      lastActiveAt: moment().toDate(),
    })
    .execute()
}

export async function getDailyActiveUserCount() {
  return db
    .selectFrom('User')
    .where('lastActiveAt', '>=', moment().subtract(24, 'hours').toDate())
    .select((eb) => eb.fn.count('id').as('activeCount'))
    .executeTakeFirstOrThrow()
    .then((row) => Number(row.activeCount || 0))
}

export async function getWeeklyActiveUserCount() {
  return db
    .selectFrom('User')
    .where('lastActiveAt', '>=', moment().subtract(1, 'week').toDate())
    .select((eb) => eb.fn.count('id').as('activeCount'))
    .executeTakeFirstOrThrow()
    .then((row) => Number(row.activeCount || 0))
}
