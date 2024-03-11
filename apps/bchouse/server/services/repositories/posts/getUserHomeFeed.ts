import { db } from '../../db/index'
import { Cursor, PaginationCursorStyle } from '../types'
import { postRowMapper } from './mappers'
import { paginate, tables } from './qb'
import { selectors } from './selectors'
import { KyselyPostDbModel } from './types'

export async function getUserHomeFeed(params: {
  userId: string | null
  cursor: Cursor | undefined
  limit?: number
  paginationStyle?: PaginationCursorStyle
}): Promise<{
  results: KyselyPostDbModel[]
  nextCursor: Cursor | undefined
}> {
  const { userId, cursor, limit, paginationStyle } = params

  if (!userId)
    return {
      results: [],
      nextCursor: undefined,
    }

  //All our reposts are defacto reposts and since we don't distinguish between retweets and quotes, we can just set wasReposted to true
  //TODO: Add an optional FK to reposts to distinguish between retweets and quotes, easily.

  const getOwnPosts = () =>
    tables.userPosts
      .where('post.publishedById', '=', userId)
      .select([selectors.wasReposted(userId), selectors.wasQuoted(userId)])

  const getOwnReposts = () =>
    tables.userReposts
      .where('repost.userId', '=', userId)
      .select([
        selectors.flag(true).as('wasReposted'),
        selectors.flag(false).as('wasQuoted'),
      ])

  const getFollowingPosts = () =>
    tables.followingPosts
      .where('following.followerId', '=', userId)
      .select([selectors.wasReposted(userId), selectors.wasQuoted(userId)])

  const getFollowingReposts = () =>
    tables.followingReposts
      .where('following.followerId', '=', userId)
      .select([
        selectors.wasReposted(userId),
        selectors.flag(false).as('wasQuoted'),
      ])

  const homeFeedQuery = db
    .selectFrom(() =>
      getOwnPosts()
        .union(getOwnReposts())
        .union(getFollowingPosts())
        .union(getFollowingReposts())
        .as('post')
    )
    .select([
      ...selectors.post.all,
      'post.username',
      'post.fullName',
      'post.firstName',
      'post.lastName',
      'post.avatarUrl',
      'post.isRepost',
      'post.repostedById',
      'post.repostedBy',
      'post.wasQuoted',
      'post.wasReposted',
      'post.embed',
      'post.bchAddress',
      selectors.wasLiked(userId),
      selectors.mediaUrls,
      selectors.likes,
      selectors.quotePosts,
      selectors.comments,
      selectors.reposts,
      selectors.wasTipped(userId),
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
    homeFeedQuery,
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
