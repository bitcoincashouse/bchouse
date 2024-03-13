import { db } from '../../db/index.js'

export async function updateLastViewedNotifications({
  userId,
}: {
  userId: string
}) {
  const result = await db
    .updateTable('User')
    .where('id', '=', userId)
    .set({
      lastViewedNotifications: new Date(),
    })
    .executeTakeFirst()

  return result.numUpdatedRows === 1n || result.numChangedRows === 1n
}
