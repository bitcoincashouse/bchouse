import { inngest } from '@bchouse/inngest'
import { detectAddressNetwork, moment } from '@bchouse/utils'
import { Doc } from '@bchouse/utils/src/tiptapSchema'
import { getUserFeed } from '../repositories/posts/getUserFeed'
import { getUserHomeFeed } from '../repositories/posts/getUserHomeFeed'
import { getUserLikes } from '../repositories/posts/getUserLikes'
import { getUserMedia } from '../repositories/posts/getUserMedia'
import { getUserReplies } from '../repositories/posts/getUserReplies'
import { Cursor } from '../repositories/types'
import HttpStatus from '../utils/http-status'
import { deserializeCursor, serializeCursor } from '../utils/serializeCursor'
import { RedisService } from './redis'
import { FeedKeys } from './redis/keys'
import { PostCardModel } from './types'

export class FeedService {
  constructor(readonly redis: RedisService) {}

  async getFeed(
    id: string,
    currentUserId: string | null,
    type: FeedKeys,
    serializedCursor?: string | undefined
  ): Promise<{
    rebuilding: boolean
    refresh: boolean
    posts: PostCardModel[]
    nextCursor: string | undefined
  }> {
    const redisState = await this.redis.getRedisStatus()

    if (redisState === 'idle') {
      await inngest.send({
        name: 'redis/rebuild',
        data: {},
      })
    }

    if (redisState !== 'built') {
      return {
        rebuilding: true,
        refresh: false,
        posts: [],
        nextCursor: undefined,
      } as const
    }

    if (currentUserId) {
      await this.redis.initialize(currentUserId)
    }

    const cursor = deserializeCursor(serializedCursor)
    const hasTimeline = await this.redis.hasTimeline(id, type)

    //When rebuilding a timeline, user should start from the top if they have an existing cursor
    if (!hasTimeline && !!cursor) {
      return {
        refresh: true,
        rebuilding: false,
        posts: [] as PostCardModel[],
        nextCursor: undefined,
      } as const
    }

    //If user's timeline is rebuilt using db, we still need to fetch total posts for that timeline.
    //This way we can fetch more when the user paginates and populate the cache.

    //Thing is, we can build userTimeline, repliesTimeline, mediaTimeline, (and I guess likesTimeline)
    // directly for the user themselves (not when fetching that timeline)
    // homeTimeline though can be, as long as post is added which again needs more info like parentPost
    //Attempt to fetch the user's timeline.
    const result = await this.redis.getTimeline(id, currentUserId, type, cursor)

    return result
  }

  async getDbFeed(
    id: string,
    currentUserId: string | null,
    type: FeedKeys,
    cursor?: Cursor
  ): Promise<{
    rebuilding: boolean
    refresh: boolean
    posts: PostCardModel[]
    nextCursor: string | undefined
  }> {
    let fn

    switch (type) {
      case 'home':
        fn = getUserHomeFeed({
          userId: currentUserId,
          cursor,
          paginationStyle: 'LAST_OF_CURRENT_PAGE',
        })
        break
      case 'user':
        fn = getUserFeed({
          userId: id,
          currentUserId,
          cursor,
          paginationStyle: 'LAST_OF_CURRENT_PAGE',
        })
        break
      case 'likes':
        fn = getUserLikes({
          userId: id,
          currentUserId,
          cursor,
          paginationStyle: 'LAST_OF_CURRENT_PAGE',
        })
        break
      case 'media':
        fn = getUserMedia({
          userId: id,
          currentUserId,
          cursor,
          paginationStyle: 'LAST_OF_CURRENT_PAGE',
        })
        break
      case 'replies':
        fn = getUserReplies({
          userId: id,
          currentUserId,
          cursor,
          paginationStyle: 'LAST_OF_CURRENT_PAGE',
        })
        break
      default:
        throw new Response('Bad request', { status: HttpStatus.BAD_REQUEST })
    }

    const feedResult = await fn

    const feed = {
      rebuilding: false,
      refresh: false,
      posts: feedResult.results.map(
        (
          post
        ): PostCardModel & {
          createdAt: Date
          parentPostId?: string | null
          parentPostPublishedById?: string | null
          mediaIds: {
            url: string
            height: number
            width: number
          }[]
        } => {
          return {
            id: post.id,
            deleted: post.deleted || false,
            key: post.key,
            type: 'comment',
            parentPostId: post.parentPostId,
            parentPostPublishedById: post.parentPostPublishedById,
            mediaIds: post.mediaUrls || [],
            mediaUrls: post.mediaUrls?.filter(Boolean) || [],
            repostedBy: post._computed.repostedBy,
            repostedById: post._computed.repostedById,
            wasLiked: post._computed.wasLiked,
            wasReposted: post._computed.wasReposted,
            wasTipped: post._computed.wasTipped,
            tipAmount: post._count.tipAmount,
            embed: post.embed,
            person: {
              name: post.publishedBy.fullName || post.publishedBy.username,
              href: '#',
              handle: post.publishedBy.username,
              bchAddress: post.publishedBy.bchAddress,
              network: post.publishedBy.bchAddress
                ? detectAddressNetwork(post.publishedBy.bchAddress)
                : null,
            },
            replyCount: post._count.replies,
            repostCount: post._count.reposts,
            likeCount: post._count.likes,
            viewCount: 1,
            avatarUrl: post.publishedBy.avatarUrl,
            content: post.content as Doc,
            createdAt: post.createdAt,
            date: moment(post.createdAt).fromNow(),
            isThread: post._computed.isThread,
            quoteCount: post._count.quotePosts,
            publishedById: post.publishedById,
          }
        }
      ),
      nextCursor: serializeCursor(feedResult.nextCursor),
    }

    return feed
  }
}
