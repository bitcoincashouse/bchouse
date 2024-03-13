import { db } from '../../db/index'

export async function unrepostPost(params: {
  userId: string
  postId: string
}): Promise<boolean> {
  const { userId, postId } = params
  const result = await db
    .deleteFrom('Reposts')
    .where(({ and, cmpr }) =>
      and([cmpr('userId', '=', userId), cmpr('postId', '=', postId)])
    )
    .executeTakeFirst()

  return result.numDeletedRows === 1n
}
