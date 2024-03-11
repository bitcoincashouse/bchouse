import { db } from '../../db/index'
import { Cursor, PaginationCursorStyle } from '../types'
import { postRowMapper } from './mappers'
import { paginate } from './qb'
import { selectors } from './selectors'
import { KyselyPostDbModel } from './types'

export async function getUserReplies(params: {
  userId: string
  currentUserId: string | null
  cursor: Cursor | undefined
  limit?: number
  paginationStyle?: PaginationCursorStyle
}): Promise<{
  results: KyselyPostDbModel[]
  nextCursor: Cursor | undefined
}> {
  const { userId, currentUserId } = params
  const { cursor, limit, paginationStyle } = params

  const userRepliesQuery = db
    .selectFrom('Post as post')
    .innerJoin('User as publishedBy', 'publishedBy.id', 'post.publishedById')
    .where((eb) =>
      eb.and([
        eb('post.publishedById', '=', userId),
        eb('post.parentPostId', 'is not', null),
      ])
    )
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
    .leftJoin('Post as parentPost', 'parentPost.id', 'post.parentPostId')
    .leftJoin(
      'User as parentPublishedBy',
      'parentPublishedBy.id',
      'parentPost.id'
    )
    .select('parentPost.publishedById as parentPostPublishedById')

  return await paginate(
    userRepliesQuery,
    'post.id',
    'post.createdAt',
    cursor,
    limit,
    paginationStyle
  ).then(({ results, nextCursor }) => {
    return {
      results: results.map((post) => {
        return postRowMapper(post)
      }),
      nextCursor,
    }
  })
}
