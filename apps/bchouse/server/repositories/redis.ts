import { jsonBuildObject } from 'kysely/helpers/mysql'
import { Network, db } from '../db/index'
import { paginate } from './paginate'
import { selectors } from './posts/selectors'
import { Cursor } from './types'
export async function getRedisUserProfilePaginated(params?: {
  limit?: number
  cursor: Cursor | undefined
}): Promise<{
  results: Array<{
    id: string
    username: string
    firstName: string | null
    lastName: string | null
    avatarUrl: string | null
    coverPhotoUrl: string | null
    about: string | null
    email: string | null
    company: string | null
    title: string | null
    website: string | null
    bchAddress: string | null
    createdAt: Date
    updatedAt: Date
  }>
  nextCursor: Cursor | undefined
}> {
  const { cursor, limit = 20 } = params || {}

  return await paginate(
    db
      .selectFrom('User as user')
      .select([
        'user.id',
        'user.username',
        'user.firstName',
        'user.lastName',
        'user.avatarUrl',
        'user.coverPhotoUrl',
        'user.about',
        'user.email',
        'user.company',
        'user.title',
        'user.website',
        'user.bchAddress',
        'user.createdAt',
        'user.updatedAt',
      ]),
    'user.id',
    'user.createdAt',
    cursor,
    limit,
    (lastResult) => ({
      fromId: lastResult.id,
      fromTimestamp: lastResult.createdAt,
    })
  )
}

export async function getRedisUserFollowersPaginated(params: {
  userId: string
  limit?: number
  cursor: Cursor | undefined
}): Promise<{
  results: Array<{
    id: string
    createdAt: Date
  }>
  nextCursor: Cursor | undefined
}> {
  const { userId, cursor, limit = 20 } = params || {}

  return await paginate(
    db
      .selectFrom('Follows as follow')
      .innerJoin('User as follower', 'follower.id', 'follow.followerId')
      .where('followedId', '=', userId)
      .select(['follower.id', 'follower.createdAt']),
    'follower.id',
    'follower.createdAt',
    cursor,
    limit,
    (lastResult) => ({
      fromTimestamp: lastResult.createdAt,
      fromId: lastResult.id,
    })
  )
}

export async function getRedisUserHomePostsPaginated(params: {
  userId: string | null
  cursor: Cursor | undefined
  limit?: number
}): Promise<{
  results: Array<{
    id: string
    publishedById: string
    repostedById: string | undefined
    createdAt: Date
  }>
  nextCursor: Cursor | undefined
}> {
  const { userId, cursor, limit } = params

  if (!userId)
    return {
      results: [],
      nextCursor: undefined,
    }

  //All our reposts are defacto reposts and since we don't distinguish between retweets and quotes, we can just set wasReposted to true
  //TODO: Add an optional FK to reposts to distinguish between retweets and quotes, easily.

  const getOwnPosts = () =>
    db
      .selectFrom('Post as post')
      .innerJoin('User as publishedBy', 'publishedBy.id', 'post.publishedById')
      .select([
        'post.id',
        'post.publishedById',
        'post.parentPostId',
        'post.createdAt as createdAt',
        'post.publishedById as repostedById',
        'publishedBy.username as repostedBy',
        selectors.flag(false).as('isRepost'),
      ])
      .where('post.publishedById', '=', userId)

  const getOwnReposts = () =>
    db
      .selectFrom('Reposts as repost')
      .innerJoin('Post as post', 'post.id', 'repost.postId')
      .innerJoin('User as publishedBy', 'publishedBy.id', 'post.publishedById')
      .innerJoin('User as repostedBy', 'repostedBy.id', 'repost.userId')
      .select([
        'post.id',
        'post.publishedById',
        'post.parentPostId',
        'repost.createdAt as createdAt',
        'repost.userId as repostedById',
        'repostedBy.username as repostedBy',
        selectors.flag(true).as('isRepost'),
      ])
      .where('repost.userId', '=', userId)

  const getFollowingPosts = () =>
    db
      .selectFrom('Post as post')
      .innerJoin(
        'Follows as following',
        'following.followedId',
        'post.publishedById'
      )
      .innerJoin('User as publishedBy', 'publishedBy.id', 'post.publishedById')
      .select([
        'post.id',
        'post.publishedById',
        'post.parentPostId',
        'post.createdAt as createdAt',
        'post.publishedById as repostedById',
        'publishedBy.username as repostedBy',
        selectors.flag(false).as('isRepost'),
      ])
      .where('following.followerId', '=', userId)

  const getFollowingReposts = () =>
    db
      .selectFrom('Follows as following')
      .innerJoin('Reposts as repost', 'repost.userId', 'following.followedId')
      .innerJoin('Post as post', 'post.id', 'repost.postId')
      .innerJoin('User as publishedBy', 'publishedBy.id', 'post.publishedById')
      .innerJoin('User as repostedBy', 'repostedBy.id', 'repost.userId')
      .select([
        'post.id',
        'post.publishedById',
        'post.parentPostId',
        'repost.createdAt as createdAt',
        'repost.userId as repostedById',
        'repostedBy.username as repostedBy',
        selectors.flag(true).as('isRepost'),
      ])
      .where('following.followerId', '=', userId)

  const homeFeedQuery = db
    .selectFrom(() =>
      getOwnPosts()
        .union(getOwnReposts())
        .union(getFollowingPosts())
        .union(getFollowingReposts())
        .as('post')
    )
    .select([
      'post.id',
      'post.createdAt',
      'post.publishedById',
      'post.isRepost',
      'post.repostedById',
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
    (lastResult) => ({
      fromTimestamp: lastResult.createdAt,
      fromId: lastResult.id,
    })
  ).then(({ results, nextCursor }) => {
    return {
      results: results.map((result) => ({
        id: result.id,
        createdAt: result.createdAt,
        publishedById: result.publishedById,
        repostedById: Number(result.isRepost) ? result.repostedById : undefined,
      })),
      nextCursor,
    }
  })
}

export async function getRedisUserPostsPaginated(params: {
  userId: string | null
  cursor: Cursor | undefined
  limit?: number
}): Promise<{
  results: Array<{
    id: string
    publishedById: string
    repostedById: string | undefined
    createdAt: Date
  }>
  nextCursor: Cursor | undefined
}> {
  const { userId, cursor, limit } = params

  const getOwnPosts = () =>
    db
      .selectFrom('Post as post')
      .innerJoin('User as publishedBy', 'publishedBy.id', 'post.publishedById')
      .select([
        'post.id',
        'post.publishedById',
        'post.parentPostId',
        'post.createdAt as createdAt',
        'post.publishedById as repostedById',
        'publishedBy.username as repostedBy',
        selectors.flag(false).as('isRepost'),
      ])
      .where((eb) =>
        eb
          .eb('post.publishedById', '=', userId)
          .and('post.parentPostId', 'is', null)
      )

  const getOwnReposts = () =>
    db
      .selectFrom('Reposts as repost')
      .innerJoin('Post as post', 'post.id', 'repost.postId')
      .innerJoin('User as publishedBy', 'publishedBy.id', 'post.publishedById')
      .innerJoin('User as repostedBy', 'repostedBy.id', 'repost.userId')
      .select([
        'post.id',
        'post.publishedById',
        'post.parentPostId',
        'repost.createdAt as createdAt',
        'repost.userId as repostedById',
        'repostedBy.username as repostedBy',
        selectors.flag(true).as('isRepost'),
      ])
      .where('repost.userId', '=', userId)

  const userFeedQuery = db
    .selectFrom(() => getOwnPosts().union(getOwnReposts()).as('post'))
    .select([
      'post.id',
      'post.createdAt',
      'post.publishedById',
      'post.isRepost',
      'post.repostedById',
    ])
    .leftJoin('Post as parentPost', 'parentPost.id', 'post.parentPostId')
    .leftJoin(
      'User as parentPublishedBy',
      'parentPublishedBy.id',
      'parentPost.id'
    )
    .select('parentPost.publishedById as parentPostPublishedById')

  return await paginate(
    userFeedQuery,
    'post.id',
    'post.createdAt',
    cursor,
    limit,
    (lastResult) => ({
      fromTimestamp: lastResult.createdAt,
      fromId: lastResult.id,
    })
  ).then(({ results, nextCursor }) => {
    return {
      results: results.map((result) => ({
        id: result.id,
        createdAt: result.createdAt,
        publishedById: result.publishedById,
        repostedById: Number(result.isRepost) ? result.repostedById : undefined,
      })),
      nextCursor,
    }
  })
}

export async function getRedisUserRepostsPaginated(params: {
  userId: string | null
  cursor: Cursor | undefined
  limit?: number
}): Promise<{
  results: Array<{
    postId: string
    publishedById: string
    createdAt: Date
  }>
  nextCursor: Cursor | undefined
}> {
  const { userId, cursor, limit } = params

  return await paginate(
    db
      .selectFrom('Reposts as repost')
      .innerJoin('Post as post', 'post.id', 'repost.postId')
      .innerJoin('User as publishedBy', 'publishedBy.id', 'post.publishedById')
      .innerJoin('User as repostedBy', 'repostedBy.id', 'repost.userId')
      .select(['repost.postId', 'post.publishedById', 'repost.createdAt']),
    'repost.postId',
    'repost.createdAt',
    cursor,
    limit,
    (lastResult) => ({
      fromTimestamp: lastResult.createdAt,
      fromId: lastResult.postId,
    })
  )
}

export async function getRedisUserLikedPostsPaginated(params: {
  userId: string | null
  cursor: Cursor | undefined
  limit?: number
}): Promise<{
  results: Array<{
    postId: string
    publishedById: string
    createdAt: Date
  }>
  nextCursor: Cursor | undefined
}> {
  const { userId, cursor, limit } = params

  return await paginate(
    db
      .selectFrom('Likes as like')
      .innerJoin('User as likedBy', 'likedBy.id', 'like.userId')
      .innerJoin('Post as post', 'post.id', 'like.postId')
      .innerJoin('User as publishedBy', 'publishedBy.id', 'post.publishedById')
      .where((eb) => eb('like.userId', '=', userId))
      .select(['like.postId', 'post.publishedById', 'like.createdAt']),
    'like.postId',
    'like.createdAt',
    cursor,
    limit,
    (lastResult) => ({
      fromTimestamp: lastResult.createdAt,
      fromId: lastResult.postId,
    })
  )
}

export async function getRedisUserReplyPostsPaginated(params: {
  userId: string | null
  cursor: Cursor | undefined
  limit?: number
}): Promise<{
  results: Array<{
    postId: string
    publishedById: string
    createdAt: Date
  }>
  nextCursor: Cursor | undefined
}> {
  const { userId, cursor, limit } = params

  return await paginate(
    db
      .selectFrom('Post as post')
      .innerJoin('User as publishedBy', 'publishedBy.id', 'post.publishedById')
      .where((eb) =>
        eb.and([
          eb('post.publishedById', '=', userId),
          eb('post.parentPostId', 'is not', null),
        ])
      )
      .select(['post.id as postId', 'post.publishedById', 'post.createdAt']),
    'post.id',
    'post.createdAt',
    cursor,
    limit,
    (lastResult) => ({
      fromTimestamp: lastResult.createdAt,
      fromId: lastResult.postId,
    })
  )
}

export async function getRedisUserTippedPostsPaginated(params: {
  userId: string | null
  cursor: Cursor | undefined
  limit?: number
}): Promise<{
  results: Array<{
    postId: string
    publishedById: string
    createdAt: Date
  }>
  nextCursor: Cursor | undefined
}> {
  const { userId, cursor, limit } = params

  return await paginate(
    db
      .selectFrom('TipRequest as tr')
      .innerJoin('TipPayment as tp', 'tp.tipId', 'tr.id')
      .innerJoin('Post as p', 'p.id', 'tr.postId')
      .innerJoin('User as publishedBy', 'publishedBy.id', 'p.publishedById')
      .where((eb) => eb.eb('tr.userId', '=', userId))
      .select(['p.id as postId', 'p.publishedById', 'tp.createdAt']),
    'tr.postId',
    'tp.createdAt',
    cursor,
    limit,
    (lastResult) => ({
      fromTimestamp: lastResult.createdAt,
      fromId: lastResult.postId,
    })
  )
}

export async function getRedisUserMediaPostsPaginated(params: {
  userId: string | null
  cursor: Cursor | undefined
  limit?: number
}): Promise<{
  results: Array<{
    postId: string
    publishedById: string
    createdAt: Date
  }>
  nextCursor: Cursor | undefined
}> {
  const { userId, cursor, limit } = params

  return await paginate(
    db
      .selectFrom('Post as post')
      .innerJoin('User as publishedBy', 'publishedBy.id', 'post.publishedById')
      .where((eb) =>
        eb.and([
          eb('post.publishedById', '=', userId),
          eb
            .exists(
              eb
                .selectFrom('Media')
                .where('Media.postId', '=', eb.ref('post.id'))
                .select('Media.id')
            )
            .or('post.content', 'like', '%"type": "media"%'),
        ])
      )
      .select(['post.id as postId', 'post.publishedById', 'post.createdAt']),
    'post.id',
    'post.createdAt',
    cursor,
    limit,
    (lastResult) => ({
      fromTimestamp: lastResult.createdAt,
      fromId: lastResult.postId,
    })
  )
}

export async function getRedisUserCampaignPostsPaginated(params: {
  userId: string | null
  cursor: Cursor | undefined
  limit?: number
}): Promise<{
  results: Array<{
    postId: string
    publishedById: string
    createdAt: Date
  }>
  nextCursor: Cursor | undefined
}> {
  const { userId, cursor, limit } = params

  return await paginate(
    db
      .selectFrom('Post as post')
      .innerJoin('User as publishedBy', 'publishedBy.id', 'post.publishedById')
      .where((eb) =>
        eb.and([
          eb('post.publishedById', '=', userId),
          eb('post.campaignId', 'is not', null),
        ])
      )
      .select(['post.id as postId', 'post.publishedById', 'post.createdAt']),
    'post.id',
    'post.createdAt',
    cursor,
    limit,
    (lastResult) => ({
      fromTimestamp: lastResult.createdAt,
      fromId: lastResult.postId,
    })
  )
}

export async function getRedisPostsPaginated(params: {
  cursor: Cursor | undefined
  limit?: number
}): Promise<{
  results: Array<{
    id: string
    publishedById: string
    createdAt: Date
    content: unknown
    embed: string | null
    mediaUrls: {
      url: string
      height: number
      width: number
    }[]
    replyCount: number
    repostCount: number
    likeCount: number
    tipAmount: number
    parent?: {
      id: string
      publishedById?: string
    }
    monetization?: {
      id: string
      amount: number
      address: string
      expiresAt: number
      title: string
      network: Network
      version: number
    }
  }>
  nextCursor: Cursor | undefined
}> {
  const { cursor, limit = 20 } = params

  return paginate(
    db
      .selectFrom('Post as post')
      .innerJoin('User as user', 'user.id', 'post.publishedById')
      .select([
        selectors.likes,
        selectors.reposts,
        selectors.comments,
        selectors.tipAmount,
      ])
      .leftJoin('Post as parent', 'parent.id', 'post.parentPostId')
      .leftJoin('Campaign as campaign', 'campaign.id', 'post.campaignId')
      .where('post.status', '=', 'PUBLISHED')
      .select([
        'post.id',
        'post.publishedById',
        'post.createdAt',
        'post.content',
        'post.embed',
        (eb) =>
          eb
            .selectFrom('Media as media')
            .whereRef('media.postId', '=', 'post.id')
            .orderBy('post.createdAt', 'desc')
            .limit(6)
            .select((qb) =>
              qb.fn
                .agg<
                  {
                    url: string
                    height: number
                    width: number
                  }[]
                >('JSON_ARRAYAGG', [
                  jsonBuildObject({
                    url: qb.ref('media.url'),
                    height: qb.ref('media.height'),
                    width: qb.ref('media.width'),
                  }),
                ])
                .as('mediaUrls')
            )
            .as('mediaUrls'),
        'parent.id as parentPostId',
        'parent.publishedById as parentPublishedById',
        'campaign.id as campaignId',
        'campaign.satoshis as campaignAmount',
        'campaign.address as campaignAddress',
        'campaign.expires as campaignExpires',
        'campaign.title as campaignTitle',
        'campaign.network as campaignNetwork',
        'campaign.version as campaignVersion',
      ]),
    'post.id',
    'post.createdAt',
    cursor,
    limit,
    (lastResult) => ({
      fromTimestamp: lastResult.createdAt,
      fromId: lastResult.id,
    })
  ).then(({ results, nextCursor }) => {
    return {
      results: results.map((post) => {
        return {
          id: post.id,
          publishedById: post.publishedById,
          createdAt: post.createdAt,
          content: post.content,
          mediaUrls: post.mediaUrls || [],
          replyCount: Number(post.comments || 0),
          repostCount: Number(post.reposts || 0),
          likeCount: Number(post.likes || 0),
          tipAmount: Number(post.tipAmount || 0),
          embed: post.embed,
          parentPost:
            post.parentPostId && post.parentPublishedById
              ? {
                  id: post.parentPostId,
                  publishedById: post.parentPublishedById,
                }
              : undefined,
          monetization:
            post.campaignId &&
            post.campaignAddress &&
            post.campaignExpires &&
            post.campaignNetwork
              ? {
                  id: post.campaignId,
                  amount: Number(post.campaignAmount || 0),
                  address: post.campaignAddress,
                  expiresAt: post.campaignExpires,
                  title: post.campaignTitle || '',
                  network: post.campaignNetwork,
                  version: post.campaignVersion || 0,
                }
              : undefined,
        }
      }),
      nextCursor,
    }
  })
}
