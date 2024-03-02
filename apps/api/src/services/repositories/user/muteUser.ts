import { db } from '~/services/db'

export async function muteUser(params: {
  userId: string
  mutedUserId: string
}): Promise<boolean> {
  const { userId, mutedUserId } = params
  const result = await db
    .insertInto('Mute')
    .values({ userId, mutedUserId })
    .ignore()
    .executeTakeFirst()
  return result.numInsertedOrUpdatedRows === 1n
}

export async function unmuteUser(params: {
  userId: string
  mutedUserId: string
}): Promise<boolean> {
  const { userId, mutedUserId } = params
  const result = await db
    .deleteFrom('Mute')
    .where((eb) =>
      eb('userId', '=', userId).and('mutedUserId', '=', mutedUserId)
    )
    .executeTakeFirst()

  return result.numDeletedRows === 1n
}
