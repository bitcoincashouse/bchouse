import { db } from '../../db/index'
import { Cursor, PaginationCursorStyle } from '../types'
import { postRowMapper } from './mappers'
import { paginate } from './qb'
import { selectors } from './selectors'
import { KyselyPostDbModel } from './types'

export async function getUserLikes(params: {
  userId: string
  currentUserId: string | null
  cursor: Cursor | undefined
  limit?: number
  paginationStyle?: PaginationCursorStyle
}): Promise<{
  results: KyselyPostDbModel[]
  nextCursor: Cursor | undefined
}> {
  const { userId, currentUserId, paginationStyle, limit, cursor } = params

  const userLikeQuery = db
    .selectFrom('Likes as like')
    .innerJoin('User as likedBy', 'likedBy.id', 'like.userId')
    .innerJoin('Post as post', 'post.id', 'like.postId')
    .innerJoin('User as publishedBy', 'publishedBy.id', 'post.publishedById')
    .where((eb) => eb('like.userId', '=', userId))
    .select([
      'post.id as postId',
      'post.id',
      'post.type',
      'post.publishedById',
      'post.content',
      'post.status',
      'post.audience',
      'post.createdAt',
      'post.updatedAt',
      'post.viewCount',
      'post.parentPostId',
      'post.quotePostId',
      'publishedBy.fullName',
      'post.embed',
      'publishedBy.firstName',
      'publishedBy.lastName',
      'publishedBy.username',
      'publishedBy.avatarUrl',
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
    userLikeQuery,
    'like.id',
    'like.createdAt',
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

export async function getAllUserLikes(params: {
  userId: string
}): Promise<{ id: string; createdAt: Date }[]> {
  const { userId } = params

  const result = await db
    .selectFrom('Likes as like')
    .where(({ or, and, cmpr }) => and([cmpr('like.userId', '=', userId)]))
    .select(['like.id', 'like.createdAt'])
    .orderBy('like.createdAt', 'desc')
    .orderBy('like.id', 'desc')
    .execute()

  return result
}
