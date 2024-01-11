import { db } from '../../db/index'

export async function repost(params: {
  userId: string
  postId: string
}): Promise<boolean> {
  const { userId, postId } = params
  const result = await db
    .insertInto('Reposts')
    .values({ userId, postId })
    .ignore()
    .executeTakeFirst()
  return result.numInsertedOrUpdatedRows === 1n
}
