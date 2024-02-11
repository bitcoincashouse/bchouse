import { db } from '../../db/index'

export async function reportPost(params: {
  userId: string
  postId: string
}): Promise<boolean> {
  const { userId, postId } = params
  const result = await db
    .insertInto('ReportedPosts')
    .values({
      reporterId: userId,
      postId,
      updatedAt: new Date(),
    })
    .ignore()
    .executeTakeFirst()
  return result.numInsertedOrUpdatedRows === 1n
}
