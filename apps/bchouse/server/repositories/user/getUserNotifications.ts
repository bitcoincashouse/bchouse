import { Kysely, sql } from 'kysely'
import { DB } from '../../db/index'
import moment from '../../utils/moment'
import { selectors } from '../posts/selectors'
import { Notification, PostTypeNotification } from './types'

export type NotificationType =
  | 'MENTION'
  | 'LIKE'
  | 'REPLY'
  | 'REPOST'
  | 'FOLLOW'
  | 'TIP'

export async function getUserMentions(
  db: Kysely<DB>,
  params: { id: string | null }
): Promise<PostTypeNotification[]> {
  const { id } = params
  // We want to select all
  // mentions, likes, replies, reposts, follows, accepted invites, and donations

  if (!id) return []

  const metionsQuery = db
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
      ...selectors.post.all,
      ...selectors.post.publishedBy,
      'post.deleted',
      'post.publishedById as sourceUserId',
      'post.id as targetPostId',
      selectors.wasReposted(id),
      selectors.wasQuoted(id),
      selectors.wasLiked(id),
      selectors.wasTipped(id),
      selectors.isFollowed(id),
      selectors.isMuted(id),
      selectors.isBlocked(id),
      selectors.likes,
      selectors.quotePosts,
      selectors.comments,
      selectors.reposts,
      selectors.tipAmount,
    ])
    .orderBy('post.createdAt', 'desc')

  const [notifications, { lastViewedNotifications: lastViewedMentions }] =
    await Promise.all([
      Promise.all([Promise.resolve().then(() => metionsQuery.execute())]),
      db
        .selectFrom('User as u')
        .where('id', '=', id)
        .select('lastViewedNotifications')
        .executeTakeFirstOrThrow(),
    ])

  return notifications
    .flat()
    .sort((a, b) => moment.utc(b.createdAt).diff(moment.utc(a.createdAt)))
    .map((row) => {
      const key = 'MENTION:' + row.id

      let href = `/profile/${row.username}/status/${row.id}`

      return {
        key,
        href,
        type: 'MENTION' as const,
        sourceUser: {
          id: row.sourceUserId,
          fullName: row.fullName || '',
          username: row.username || '',
          avatarUrl: row.avatarUrl || '',
        },
        sourcePost: {
          id: row.id as string,
          publishedBy: {
            id: row.sourceUserId,
            fullName: row.fullName || '',
            username: row.username || '',
            avatarUrl: row.avatarUrl || '',
          },
          createdAt: row.createdAt,
          _count: {
            replies: parseInt(row['comments'] as string),
            reposts: parseInt(row['reposts'] as string), //row.reposts,
            quotePosts: parseInt(row['quotePosts'] as string), // row.quotePosts,
            likes: parseInt(row['likes'] as string), //row.likes,
          },
          _computed: {
            wasLiked: !!row.wasLiked,
            repostedBy: undefined,
            wasReposted: !!row.wasReposted || !!row.wasQuoted,
            isThread: false,
          },
          content: row.deleted
            ? ({
                content: [
                  {
                    type: 'paragraph',
                    content: [
                      {
                        type: 'text',
                        text: 'This post was deleted',
                      },
                    ],
                  },
                ],
              } as unknown)
            : row.content,
        },
        status: 'UNREAD' as const,
        createdAt: row['createdAt'],
        viewed: lastViewedMentions && lastViewedMentions > row.createdAt,
      } as PostTypeNotification
    })
}

export async function getUserNotifications(
  db: Kysely<DB>,
  params: { id: string | null }
): Promise<Notification[]> {
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
      ...selectors.post.all,
      ...selectors.post.publishedBy,
      'post.deleted',
      'post.publishedById as sourceUserId',
      'parentPost.id as targetPostId',
      sql`'REPLY'`.$castTo<'REPLY'>().as('notificationType'),
      selectors.wasReposted(id),
      selectors.wasQuoted(id),
      selectors.wasLiked(id),
      selectors.wasTipped(id),
      selectors.isFollowed(id),
      selectors.isMuted(id),
      selectors.isBlocked(id),
      selectors.likes,
      selectors.quotePosts,
      selectors.comments,
      selectors.reposts,
      selectors.tipAmount,
    ])
    .orderBy('post.createdAt', 'desc')

  const tipsQuery = db
    .selectFrom('TipRequest as tr')
    .innerJoin('TipPayment as tp', 'tp.tipId', 'tr.id')
    .innerJoin('Post as tippedPost', 'tippedPost.id', 'tr.postId')
    .leftJoin('User as tippedBy', 'tippedBy.id', 'tr.userId')
    .where(({ and, cmpr, ref }) =>
      and([
        cmpr('tippedPost.publishedById', '=', id),
        cmpr('tr.userId', '!=', id),
        cmpr('tp.createdAt', '>', moment().subtract(60, 'days').toDate()),
      ])
    )
    .select([
      'tr.id',
      'tr.userId as sourceUserId',
      'tippedBy.fullName',
      'tippedBy.username',
      'tippedBy.avatarUrl',
      'tippedPost.content',
      'tp.createdAt',
      'tippedPost.id as targetPostId',
      'tp.satoshis as tippedAmount',
      sql`'TIP'`.$castTo<'TIP'>().as('notificationType'),
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
      'likedBy.fullName',
      'likedBy.username',
      'likedBy.avatarUrl',
      'likedPost.content',
      'like.createdAt',
      'likedPost.id as targetPostId',
      sql`'LIKE'`.$castTo<'LIKE'>().as('notificationType'),
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
      'repostedBy.fullName',
      'repostedBy.username',
      'repostedBy.avatarUrl',
      'repostedPost.content',
      'repost.createdAt',
      'repostedPost.id as targetPostId',
      sql`'REPOST'`.$castTo<'REPOST'>().as('notificationType'),
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
      'quotedBy.fullName',
      'quotedBy.username',
      'quotedBy.avatarUrl',
      'quotePost.content',
      'quotePost.createdAt',
      'quotedPost.id as targetPostId',
      sql`'QUOTE'`.$castTo<'QUOTE'>().as('notificationType'),
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
      'followedBy.fullName',
      'followedBy.username',
      'followedBy.avatarUrl',
      'follow.createdAt',
      sql`'FOLLOW'`.$castTo<'FOLLOW'>().as('notificationType'),
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
      ...selectors.post.all,
      ...selectors.post.publishedBy,
      'post.deleted',
      'post.publishedById as sourceUserId',
      'post.id as targetPostId',
      sql`'MENTION'`.$castTo<'MENTION'>().as('notificationType'),
      selectors.wasReposted(id),
      selectors.wasQuoted(id),
      selectors.wasLiked(id),
      selectors.wasTipped(id),
      selectors.isFollowed(id),
      selectors.isMuted(id),
      selectors.isBlocked(id),
      selectors.likes,
      selectors.quotePosts,
      selectors.comments,
      selectors.reposts,
      selectors.tipAmount,
    ])
    .orderBy('post.createdAt', 'desc')

  const [notifications, { lastViewedNotifications }] = await Promise.all([
    Promise.all([
      Promise.resolve().then(() => repliesQuery.execute()),
      Promise.resolve().then(() => mentionsQuery.execute()),
      Promise.resolve().then(() => likesQuery.execute()),
      Promise.resolve().then(() => tipsQuery.execute()),
      Promise.resolve().then(() => repostsQuery.execute()),
      Promise.resolve().then(() => quotedQuery.execute()),
      Promise.resolve().then(() => followsQuery.execute()),
    ]),
    db
      .selectFrom('User as u')
      .where('id', '=', id)
      .select('lastViewedNotifications')
      .executeTakeFirstOrThrow(),
  ])

  return notifications
    .flat()
    .sort((a, b) => moment.utc(b.createdAt).diff(moment.utc(a.createdAt)))
    .map((row) => {
      const key = row.notificationType + ':' + row.id

      let href = ''
      switch (row.notificationType) {
        case 'FOLLOW':
          href = `/profile/${row.username}`
          break
        case 'REPOST':
          href = `/profile/${row.username}/status/${row.targetPostId}`
          break
        case 'MENTION':
          href = `/profile/${row.username}/status/${row.targetPostId}`
          break
        case 'LIKE':
          href = `/profile/${row.username}/status/${row.targetPostId}`
          break
        case 'TIP':
          href = `/profile/${row.username}/status/${row.targetPostId}`
          break
        case 'QUOTE':
          href = `/profile/${row.username}/status/${row.id}`
          break
        case 'REPLY':
          href = `/profile/${row.username}/status/${row.id}`
          break
      }

      const notificationVm =
        row.notificationType === 'REPLY' || row.notificationType === 'MENTION'
          ? ({
              key,
              href,
              type: row.notificationType,
              sourceUser: {
                id: row.sourceUserId,
                fullName: row.fullName || '',
                username: row.username || '',
                avatarUrl: row.avatarUrl || '',
              },
              sourcePost: {
                id: row.id as string,
                publishedBy: {
                  id: row.sourceUserId,
                  fullName: row.fullName || '',
                  username: row.username || '',
                  avatarUrl: row.avatarUrl || '',
                },
                createdAt: row.createdAt,
                _count: {
                  replies: parseInt(row['comments'] as string),
                  reposts: parseInt(row['reposts'] as string), //row.reposts,
                  quotePosts: parseInt(row['quotePosts'] as string), // row.quotePosts,
                  likes: parseInt(row['likes'] as string), //row.likes,
                },
                _computed: {
                  wasLiked: !!row.wasLiked,
                  repostedBy: undefined,
                  wasReposted: !!row.wasReposted || !!row.wasQuoted,
                  isThread: false,
                },
                isFollowed: !!row.isFollowed,
                isMuted: !!row.isMuted,
                isBlocked: !!row.isBlocked,
                content: row.deleted
                  ? ({
                      content: [
                        {
                          type: 'paragraph',
                          content: [
                            {
                              type: 'text',
                              text: 'This post was deleted',
                            },
                          ],
                        },
                      ],
                    } as unknown)
                  : row.content,
              },
              status: 'UNREAD' as const,
              createdAt: row['createdAt'],
              viewed:
                lastViewedNotifications &&
                lastViewedNotifications > row.createdAt,
            } as Notification)
          : row.notificationType === 'TIP'
          ? ({
              key,
              href,
              type: row.notificationType,
              sourceUser: {
                id: row.sourceUserId,
                fullName: row.fullName || '',
                username: row.username || '',
                avatarUrl: row.avatarUrl || '',
              },
              tippedAmount: Number(row.tippedAmount),
              status: 'UNREAD' as const,
              createdAt: row['createdAt'],
              viewed:
                lastViewedNotifications &&
                lastViewedNotifications > row.createdAt,
            } as Notification)
          : ({
              key,
              href,
              type: row.notificationType,
              sourceUser: {
                id: row.sourceUserId,
                fullName: row.fullName || '',
                username: row.username || '',
                avatarUrl: row.avatarUrl || '',
              },
              status: 'UNREAD' as const,
              createdAt: row['createdAt'],
              viewed:
                lastViewedNotifications &&
                lastViewedNotifications > row.createdAt,
            } as Notification)

      return notificationVm
    })
}
