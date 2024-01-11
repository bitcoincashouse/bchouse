import { db } from '../../db/index'

export async function likePost(params: {
  userId: string
  postId: string
}): Promise<boolean> {
  const { userId, postId } = params
  const result = await db
    .insertInto('Likes')
    .values({ userId, postId })
    .ignore()
    .executeTakeFirst()
  return result.numInsertedOrUpdatedRows === 1n
}
