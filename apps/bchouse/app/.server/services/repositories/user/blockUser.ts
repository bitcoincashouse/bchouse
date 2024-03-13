import { db } from '~/server/services/db'

export async function blockUser(params: {
  userId: string
  blockedUserId: string
}): Promise<boolean> {
  const { userId, blockedUserId } = params
  const result = await db
    .insertInto('Block')
    .values({ userId, blockedUserId })
    .ignore()
    .executeTakeFirst()
  return result.numInsertedOrUpdatedRows === 1n
}

export async function unblockUser(params: {
  userId: string
  blockedUserId: string
}): Promise<boolean> {
  const { userId, blockedUserId } = params
  const result = await db
    .deleteFrom('Block')
    .where((eb) =>
      eb('userId', '=', userId).and('blockedUserId', '=', blockedUserId)
    )
    .executeTakeFirst()

  return result.numDeletedRows === 1n
}
