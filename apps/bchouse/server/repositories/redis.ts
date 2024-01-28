import { sql } from 'kysely'
import { jsonBuildObject } from 'kysely/helpers/mysql'
import { Network, db } from '../db/index'
import { ActivityData } from '../services/redis/activity'
import moment from '../utils/moment'
import { paginate } from './paginate'
import { selectors } from './posts/selectors'
import { Cursor } from './types'
import { Notification } from './user/types'

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

export async function getRedisUserNotifications(params: {
  id: string | null
}): Promise<ActivityData[]> {
  const { id } = params
  // We want to select all
  // mentions, likes, replies, reposts, follows, accepted invites, and donations

  if (!id) return []

  const repliesQuery = db
    .selectFrom('Post as post')
    .innerJoin('User as publishedBy', 'publishedBy.id', 'post.publishedById')
    .innerJoin('Post as parentPost', 'parentPost.id', 'post.parentPostId')
    .where(({ and, cmpr, ref }) =>
      and([
        cmpr('parentPost.publishedById', '=', id),
        cmpr('post.publishedById', '!=', id),
        cmpr('post.createdAt', '>', moment().subtract(60, 'days').toDate()),
      ])
    )
    .select([
      'post.id',
      'post.publishedById as sourceUserId',
      'post.createdAt',
      'parentPost.id as targetPostId',
      sql`'REPLY'`.$castTo<Notification['type']>().as('notificationType'),
      sql`''`.$castTo<string>().as('data'),
    ])

  const tipsQuery = db
    .selectFrom('TipRequest as tr')
    .innerJoin('TipPayment as tp', 'tp.tipId', 'tr.id')
    .innerJoin('Post as tippedPost', 'tippedPost.id', 'tr.postId')
    .where(({ and, cmpr, ref }) =>
      and([
        cmpr('tippedPost.publishedById', '=', id),
        cmpr('tr.userId', '!=', id),
        cmpr('tp.createdAt', '>', moment().subtract(60, 'days').toDate()),
      ])
    )
    .select([
      'tr.id',
      sql`NULLIF(tr.userId, 'anonymous')`.$castTo<string>().as('sourceUserId'),
      'tp.createdAt',
      'tr.postId as targetPostId',
      sql`'TIP'`.$castTo<Notification['type']>().as('notificationType'),
      sql`CONVERT(tp.satoshis,char)`.$castTo<string>().as('data'),
    ])

  const likesQuery = db
    .selectFrom('Likes as like')
    .innerJoin('Post as likedPost', 'likedPost.id', 'like.postId')
    .innerJoin('User as likedBy', 'likedBy.id', 'like.userId')
    .where(({ and, cmpr, ref }) =>
      and([
        cmpr('likedPost.publishedById', '=', id),
        cmpr('like.userId', '!=', id),
        cmpr('like.createdAt', '>', moment().subtract(60, 'days').toDate()),
      ])
    )
    .select([
      'like.id',
      'like.userId as sourceUserId',
      'like.createdAt',
      'like.postId as targetPostId',
      sql`'LIKE'`.$castTo<Notification['type']>().as('notificationType'),
      sql`''`.$castTo<string>().as('data'),
    ])

  const repostsQuery = db
    .selectFrom('Reposts as repost')
    .innerJoin('Post as repostedPost', 'repostedPost.id', 'repost.postId')
    .innerJoin('User as repostedBy', 'repostedBy.id', 'repost.userId')
    .where(({ and, cmpr, ref }) =>
      and([
        cmpr('repostedPost.publishedById', '=', id),
        cmpr('repost.userId', '!=', id),
        cmpr('repost.createdAt', '>', moment().subtract(60, 'days').toDate()),
      ])
    )
    .select([
      'repost.id',
      'repost.userId as sourceUserId',
      'repost.createdAt',
      'repostedPost.id as targetPostId',
      sql`'REPOST'`.$castTo<Notification['type']>().as('notificationType'),
      sql`''`.$castTo<string>().as('data'),
    ])

  const quotedQuery = db
    .selectFrom('Post as quotePost')
    .innerJoin('Post as quotedPost', 'quotedPost.id', 'quotePost.quotePostId')
    .innerJoin('User as quotedBy', 'quotedBy.id', 'quotePost.publishedById')
    .where(({ and, cmpr, ref }) =>
      and([
        cmpr('quotedPost.publishedById', '=', id),
        cmpr('quotePost.publishedById', '!=', id),
        cmpr(
          'quotePost.createdAt',
          '>',
          moment().subtract(60, 'days').toDate()
        ),
      ])
    )
    .select([
      'quotePost.id',
      'quotePost.publishedById as sourceUserId',
      'quotePost.createdAt',
      'quotedPost.id as targetPostId',
      sql`'QUOTE'`.$castTo<Notification['type']>().as('notificationType'),
      sql`''`.$castTo<string>().as('data'),
    ])

  const followsQuery = db
    .selectFrom('Follows as follow')
    .innerJoin('User as followed', 'followed.id', 'follow.followedId')
    .innerJoin('User as followedBy', 'followedBy.id', 'follow.followerId')
    .where(({ and, cmpr }) =>
      and([
        cmpr('followed.id', '=', id),
        cmpr('follow.createdAt', '>', moment().subtract(60, 'days').toDate()),
      ])
    )
    .select([
      'follow.id',
      'follow.followerId as sourceUserId',
      'follow.createdAt',
      sql`''`.$castTo<string>().as('targetPostId'),
      sql`'FOLLOW'`.$castTo<Notification['type']>().as('notificationType'),
      sql`''`.$castTo<string>().as('data'),
    ])

  const mentionsQuery = db
    .selectFrom('Mention as mention')
    .innerJoin('Post as post', 'post.id', 'mention.postId')
    .innerJoin('User as publishedBy', 'publishedBy.id', 'post.publishedById')
    .where(({ and, cmpr, ref }) =>
      and([
        cmpr('mention.mention_user_id', '=', id),
        cmpr('post.publishedById', '!=', id),
        cmpr('post.createdAt', '>', moment().subtract(60, 'days').toDate()),
      ])
    )
    .select([
      'post.id',
      'post.publishedById as sourceUserId',
      'post.createdAt',
      sql`''`.$castTo<string>().as('targetPostId'),
      sql`'MENTION'`.$castTo<Notification['type']>().as('notificationType'),
      sql`''`.$castTo<string>().as('data'),
    ])

  const [notifications] = await Promise.all([
    db
      .selectFrom(
        repliesQuery
          .union(tipsQuery)
          .union(likesQuery)
          .union(repostsQuery)
          .union(quotedQuery)
          .union(followsQuery)
          .union(mentionsQuery)
          .as('n')
      )
      .select([
        'n.id',
        'n.sourceUserId',
        'n.createdAt',
        'n.targetPostId',
        'n.notificationType',
        'n.data',
      ])
      .orderBy('n.createdAt desc')
      .execute(),
  ])

  return notifications
    .map((notification): ActivityData | undefined => {
      const timestamp = moment(notification.createdAt).unix()
      if (notification.notificationType === 'FOLLOW') {
        return {
          type: 'follow',
          actorId: notification.sourceUserId,
          timestamp,
        }
      } else if (
        notification.notificationType === 'LIKE' ||
        notification.notificationType === 'REPOST'
      ) {
        return {
          type: notification.notificationType.toLowerCase() as
            | 'like'
            | 'repost',
          actorId: notification.sourceUserId,
          object: {
            postId: notification.targetPostId,
          },
          timestamp,
        }
      } else if (notification.notificationType === 'TIP') {
        return {
          type: notification.notificationType.toLowerCase() as 'tip',
          actorId: notification.sourceUserId,
          object: {
            postId: notification.targetPostId,
          },
          data: {
            tipAmount: Number(notification.data),
          },
          timestamp,
        }
      } else if (notification.notificationType === 'MENTION') {
        return {
          type: 'mention',
          actorId: notification.sourceUserId,
          data: {
            postId: notification.id,
          },
          timestamp,
        }
      } else if (notification.notificationType === 'REPLY') {
        return {
          type: 'reply',
          actorId: notification.sourceUserId,
          data: {
            postId: notification.id,
          },
          object: {
            postId: notification.targetPostId,
          },
          timestamp,
        }
      }

      return undefined
    })
    .filter(Boolean)
}

export async function getRedisUserFollowersPaginated(params: {
  userId: string
  limit?: number
  cursor: Cursor | undefined
}): Promise<{
  results: Array<{
    followerId: string
    createdAt: Date
  }>
  nextCursor: Cursor | undefined
}> {
  const { userId, cursor, limit = 20 } = params || {}

  return await paginate(
    db
      .selectFrom('Follows as follow')
      .where('followedId', '=', userId)
      .select(['follow.followerId', 'follow.createdAt']),
    'follow.followerId',
    'follow.createdAt',
    cursor,
    limit,
    (lastResult) => ({
      fromTimestamp: lastResult.createdAt,
      fromId: lastResult.followerId,
    })
  )
}

export async function getRedisUserMutesPaginated(params: {
  userId: string
  limit?: number
  cursor: Cursor | undefined
}): Promise<{
  results: Array<{
    mutedUserId: string
    createdAt: Date
  }>
  nextCursor: Cursor | undefined
}> {
  const { userId, cursor, limit = 20 } = params || {}

  return await paginate(
    db
      .selectFrom('Mute as m')
      .where('m.userId', '=', userId)
      .select(['m.mutedUserId', 'm.createdAt']),
    'm.mutedUserId',
    'm.createdAt',
    cursor,
    limit,
    (lastResult) => ({
      fromTimestamp: lastResult.createdAt,
      fromId: lastResult.mutedUserId,
    })
  )
}

export async function getRedisUserBlockingPaginated(params: {
  userId: string
  limit?: number
  cursor: Cursor | undefined
}): Promise<{
  results: Array<{
    blockedUserId: string
    createdAt: Date
  }>
  nextCursor: Cursor | undefined
}> {
  const { userId, cursor, limit = 20 } = params || {}

  return await paginate(
    db
      .selectFrom('Block as b')
      .where('b.userId', '=', userId)
      .select(['b.blockedUserId', 'b.createdAt']),
    'b.blockedUserId',
    'b.createdAt',
    cursor,
    limit,
    (lastResult) => ({
      fromTimestamp: lastResult.createdAt,
      fromId: lastResult.blockedUserId,
    })
  )
}

export async function getRedisUserBlockedByPaginated(params: {
  userId: string
  limit?: number
  cursor: Cursor | undefined
}): Promise<{
  results: Array<{
    blockingUserId: string
    createdAt: Date
  }>
  nextCursor: Cursor | undefined
}> {
  const { userId, cursor, limit = 20 } = params || {}

  return await paginate(
    db
      .selectFrom('Block as b')
      .where('b.blockedUserId', '=', userId)
      .select(['b.userId as blockingUserId', 'b.createdAt']),
    'b.blockedUserId',
    'b.createdAt',
    cursor,
    limit,
    (lastResult) => ({
      fromTimestamp: lastResult.createdAt,
      fromId: lastResult.blockingUserId,
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
    deleted: boolean
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
        'post.deleted',
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
        if (post.id === '347a6297-16fb-451f-8705-eb6270d6b706') {
          console.log(post, Boolean(post.deleted))
        }

        return {
          id: post.id,
          publishedById: post.publishedById,
          createdAt: post.createdAt,
          content: post.content,
          deleted: Boolean(post.deleted),
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
