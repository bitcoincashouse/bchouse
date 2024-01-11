import { db } from '../../db/index'
import { Cursor } from '../types'
import { postRowMapper } from './mappers'
import { selectors } from './selectors'
import { KyselyPostDbModel } from './types'

export async function getPostChildren(
  params: {
    id: string
    currentUserId: string | null
  } & Partial<Cursor>
): Promise<{
  results: KyselyPostDbModel[]
  nextCursor: Cursor | undefined
}> {
  const { id, currentUserId } = params
  const childPosts = await db
    .selectFrom('Post as post')
    .innerJoin('User as publishedBy', 'publishedBy.id', 'post.publishedById')
    .select([
      ...selectors.post.all,
      ...selectors.post.publishedBy,
      selectors.wasReposted(currentUserId),
      selectors.wasQuoted(currentUserId),
      selectors.wasLiked(currentUserId),
      selectors.mediaUrls,
      selectors.likes,
      selectors.quotePosts,
      selectors.comments,
      selectors.reposts,
      selectors.wasTipped(currentUserId),
      selectors.tipAmount,
    ])
    .innerJoin('PostPaths as c', 'c.descendantId', 'post.id')
    .where((eb) =>
      eb('c.ancestorId', '=', id)
        .and('c.depth', '=', 1)
        .and('post.id', '<>', id)
        .and('post.deleted', '!=', 1)
    )
    .orderBy('post.createdAt', 'asc')
    .execute()

  return {
    results: childPosts.map((row) =>
      postRowMapper({ ...row, parentPostPublishedById: params.id })
    ),
    nextCursor: undefined,
  }
}
