import { db } from '../../db/index'
import { Cursor, PaginationCursorStyle } from '../types'
import { postRowMapper } from './mappers'
import { paginate, tables } from './qb'
import { selectors } from './selectors'
import { KyselyPostDbModel } from './types'

export async function getUserFeed(params: {
  userId: string
  currentUserId: string | null
  cursor: Cursor | undefined
  limit?: number
  paginationStyle?: PaginationCursorStyle
}): Promise<{
  results: KyselyPostDbModel[]
  nextCursor: Cursor | undefined
}> {
  const { userId, currentUserId, cursor, limit = 20, paginationStyle } = params

  const getOwnPosts = () =>
    tables.userPosts.where((eb) => {
      //Onlt those posts that are published by the user and top-level or reposted by the user
      return eb('post.publishedById', '=', userId).and(
        'post.parentPostId',
        'is',
        null
      )
    })

  const getOwnReposts = () =>
    tables.userReposts.where('repost.userId', '=', userId)

  const posts = db
    .selectFrom(() => getOwnPosts().union(getOwnReposts()).as('post'))
    .select([
      ...selectors.post.all,
      'post.username',
      'post.fullName',
      'post.firstName',
      'post.lastName',
      'post.avatarUrl',
      'post.isRepost',
      'post.repostedBy',
      'post.repostedById',
      'post.embed',
      'post.bchAddress',
      selectors.wasReposted(currentUserId),
      selectors.wasQuoted(currentUserId),
      selectors.wasLiked(currentUserId),
      selectors.wasTipped(currentUserId),
      selectors.mediaUrls,
      selectors.likes,
      selectors.quotePosts,
      selectors.comments,
      selectors.reposts,
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
    posts,
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

export async function getAllUserPosts(params: {
  userId: string
}): Promise<{ id: string; createdAt: Date }[]> {
  const { userId } = params

  return db
    .selectFrom('Post as post')
    .where('post.publishedById', '=', userId)
    .select(['post.id', 'post.createdAt'])
    .orderBy('post.createdAt', 'desc')
    .orderBy('post.id', 'desc')
    .execute()
}

export async function getAllUserRetweets(params: {
  userId: string
}): Promise<{ id: string; createdAt: Date }[]> {
  const { userId } = params

  return db
    .selectFrom('Reposts as post')
    .where('post.userId', '=', userId)
    .select(['post.id', 'post.createdAt'])
    .orderBy('post.createdAt', 'desc')
    .orderBy('post.id', 'desc')
    .execute()
}
