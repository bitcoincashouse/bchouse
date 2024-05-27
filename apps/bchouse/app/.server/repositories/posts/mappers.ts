import { moment } from '@bchouse/utils'

export function postRowMapper(row: {
  postId: string
  fullName?: string | null
  username: string
  avatarUrl?: string | null
  content: unknown
  createdAt: Date
  mediaUrls:
    | {
        url: string
        height: number
        width: number
      }[]
    | null
  publishedById: string
  parentPostId: string | null
  parentPostPublishedById: string | null
  bchAddress?: string | null

  isFollowed?: boolean | number | string
  isMuted?: boolean | number | string
  isBlocked?: boolean | number | string

  wasLiked: boolean | number | string
  wasReposted: boolean | number | string
  wasQuoted: boolean | number | string
  wasTipped: boolean | number | string

  likes: number | string | bigint | null
  quotePosts: number | string | bigint | null
  comments: number | string | bigint | null
  reposts: number | string | bigint | null
  tipAmount: number | string | bigint | null

  isRepost?: boolean | number | string
  republishedBy?: string | null
  repostedBy?: string | null
  repostedById?: string | null
  deleted?: number
  campaignId?: string | null

  firstName: string | null
  lastName: string | null
  embed: string | null
}) {
  const deleted = Boolean(row.deleted || 0)
  const fullname = [row.firstName, row.lastName].filter(Boolean).join(' ')

  return {
    key: `${row.postId}:${handleSqlBoolean(row.isRepost) ? 'REPOST' : 'POST'}:${
      row.repostedBy || ''
    }`,
    deleted,
    mediaUrls: row.mediaUrls || [],
    id: row.postId,
    publishedById: row.publishedById,
    publishedBy: {
      fullName: fullname || row.username,
      username: row.username,
      avatarUrl: row.avatarUrl || '',
      bchAddress: row.bchAddress,
    },
    parentPostId: row.parentPostId,
    parentPostPublishedById: row.parentPostPublishedById,

    content: row.content,
    embed: row.embed,
    createdAt: row.createdAt || moment().toDate(),
    campaignId: row.campaignId,
    replies: [],
    _count: {
      replies: row.comments ? parseInt(row.comments.toString()) : 0,
      reposts: row.reposts ? parseInt(row.reposts.toString()) : 0,
      quotePosts: row.quotePosts ? parseInt(row.quotePosts.toString()) : 0,
      likes: row.likes ? parseInt(row.likes.toString()) : 0,
      tipAmount: row.tipAmount ? parseInt(row.tipAmount.toString()) : 0,
    },
    _computed: {
      wasLiked: handleSqlBoolean(row.wasLiked),
      wasTipped: handleSqlBoolean(row.wasTipped),
      repostedById: handleSqlBoolean(row.isRepost)
        ? row.repostedById || row.username
        : undefined,
      repostedBy: handleSqlBoolean(row.isRepost)
        ? row.repostedBy || row.username
        : undefined,
      wasReposted:
        handleSqlBoolean(row.wasReposted) || handleSqlBoolean(row.wasQuoted),
      isThread: false,
    },
    isFollowed: handleSqlBoolean(row.isFollowed),
    isMuted: handleSqlBoolean(row.isMuted),
    isBlocked: handleSqlBoolean(row.isBlocked),
  }
}

function handleSqlBoolean(val: string | boolean | number | undefined) {
  return !val || typeof val === 'string' ? val === '1' : !!val
}
