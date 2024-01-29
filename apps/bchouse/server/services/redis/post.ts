import type Redis from 'ioredis'
import type { ChainableCommander } from 'ioredis'
import { Network } from '~/server/db/types.js'
import moment from '../../utils/moment.js'
import { Doc } from '../../utils/tiptapSchema.js'
import {
  getAllCampaignsKey,
  getAllPostsKey,
  getKeys,
  getNotificationKeys,
  getPostEmbeddedKey,
  getPostKey,
} from './keys.js'

export function getPost({
  postId,
  publishedById,
}: {
  postId: string
  publishedById: string
}) {
  const postKey = getPostKey(postId, publishedById)

  return (p: ChainableCommander) => {
    return p.hgetall(postKey)
  }
}

export function getPostAuthor({ publishedById }: { publishedById: string }) {
  const { userDetailsKey } = getKeys(publishedById)
  return (p: ChainableCommander | Redis) => {
    return p.hgetall(userDetailsKey)
  }
}

export function getIsMutedByCurrentUser({
  currentUserId,
  publishedById,
}: {
  currentUserId: string | null
  publishedById: string
}) {
  const { mutesKey = undefined } = currentUserId ? getKeys(currentUserId) : {}

  return (p: ChainableCommander) => {
    return typeof mutesKey !== 'undefined'
      ? p.sismember(mutesKey, publishedById)
      : false
  }
}

export function getIsBlockedByCurrentUser({
  currentUserId,
  publishedById,
}: {
  currentUserId: string | null
  publishedById: string
}) {
  const { userBlockingKey = undefined } = currentUserId
    ? getKeys(currentUserId)
    : {}

  return (p: ChainableCommander) => {
    return typeof userBlockingKey !== 'undefined'
      ? p.sismember(userBlockingKey, publishedById)
      : false
  }
}

export function getIsFollowedByCurrentUser({
  currentUserId,
  publishedById,
}: {
  currentUserId: string | null
  publishedById: string
}) {
  const { followersKey } = getKeys(publishedById)

  return (p: ChainableCommander) => {
    return currentUserId ? p.zscore(followersKey, currentUserId) : false
  }
}

export function getIsLikedByCurrentUser({
  currentUserId,
  postId,
  publishedById,
}: {
  currentUserId: string | null
  postId: string
  publishedById: string
}) {
  const { likesKey = undefined } = currentUserId ? getKeys(currentUserId) : {}

  const embeddedPostKey = getPostEmbeddedKey(postId, publishedById)

  return (p: ChainableCommander) => {
    return typeof likesKey !== 'undefined'
      ? p.zscore(likesKey, embeddedPostKey)
      : false
  }
}

export function getIsRetweetedByCurrentUser({
  currentUserId,
  postId,
  publishedById,
}: {
  currentUserId: string | null
  postId: string
  publishedById: string
}) {
  const { retweetsKey: repostKey = undefined } = currentUserId
    ? getKeys(currentUserId)
    : {}

  const embeddedPostKey = getPostEmbeddedKey(postId, publishedById)

  return (p: ChainableCommander) => {
    return typeof repostKey !== 'undefined'
      ? p.zscore(repostKey, embeddedPostKey)
      : false
  }
}

export function getIsTippedByCurrentUser({
  currentUserId,
  postId,
  publishedById,
}: {
  currentUserId: string | null
  postId: string
  publishedById: string
}) {
  const { tipsKey = undefined } = currentUserId ? getKeys(currentUserId) : {}

  const embeddedPostKey = getPostEmbeddedKey(postId, publishedById)

  return (p: ChainableCommander) => {
    return typeof tipsKey !== 'undefined'
      ? p.zscore(tipsKey, embeddedPostKey)
      : false
  }
}

export function getRepostedBy({
  repostedById,
}: {
  repostedById: string | undefined | null
}) {
  return (p: ChainableCommander) => {
    return repostedById
      ? p.hget(getKeys(repostedById).userDetailsKey, 'username')
      : undefined
  }
}

export function setPost(post: {
  id: string
  publishedById: string
  createdAt: Date
  content: unknown
  mediaUrls?: { url: string; height: number; width: number }[]
  embed?: string | undefined | null
  replyCount: number
  repostCount: number
  likeCount: number
  tipAmount: number
  parentPost?: {
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
  } | null
}) {
  const postKey = getPostKey(post.id, post.publishedById)

  return (p: ChainableCommander) => {
    return p.hset(postKey, {
      id: post.id,
      publishedById: post.publishedById,
      replyCount: post.replyCount,
      repostCount: post.repostCount,
      likeCount: post.likeCount,
      viewCount: 1,
      date: moment(post.createdAt).unix(),
      embed: post.embed,
      tipAmount: post.tipAmount,

      //TODO: Resolve mentions, hashtags, and media links
      mediaUrls:
        post.mediaUrls
          ?.map(({ url, height, width }) => `${url}:${height}:${width}`)
          .join(',') || [],
      content: JSON.stringify(post.content),
      isThread: false,
      parent_post_id: post.parentPost?.id,
      parent_post_publishedById: post.parentPost?.publishedById,

      monetization_id: post.monetization?.id,
      monetization_amount: post.monetization?.amount,
      monetization_address: post.monetization?.address,
      monetization_expires: post.monetization?.expiresAt,
      monetization_title: post.monetization?.title,
      monetization_network: post.monetization?.network,
      monetization_version: post.monetization?.version,
    })
  }
}

export function addToHomeTimeline(post: {
  id: string
  publishedById: string
  repostedById?: string
  createdAt: Date
  parentPost?: {
    id: string
  }
}) {
  //If reposted, add to their home timeline
  const { homeTimelineKey } = getKeys(post.repostedById || post.publishedById)
  const likeOrRepostKey = getPostEmbeddedKey(
    post.id,
    post.publishedById,
    post.repostedById
  )

  return (p: ChainableCommander) => {
    return !post.parentPost?.id
      ? p.zadd(homeTimelineKey, -moment(post.createdAt).unix(), likeOrRepostKey)
      : undefined
  }
}

export function addToUserTimeline(post: {
  id: string
  publishedById: string
  repostedById?: string
  createdAt: Date
  parentPost?: {
    id: string
  }
}) {
  //If reposted, add to their user timeline
  const { userTimelineKey } = getKeys(post.repostedById || post.publishedById)
  const likeOrRepostKey = getPostEmbeddedKey(
    post.id,
    post.publishedById,
    post.repostedById
  )

  return (p: ChainableCommander) => {
    return !post.parentPost?.id
      ? p.zadd(userTimelineKey, -moment(post.createdAt).unix(), likeOrRepostKey)
      : undefined
  }
}

export function incrementParentReplies(post: {
  id: string
  publishedById: string
  createdAt: Date
  parentPost?: {
    id: string
    publishedById: string
  }
}) {
  const parentPostKey = post.parentPost
    ? getPostKey(post.parentPost.id, post.parentPost.publishedById)
    : undefined

  return (p: ChainableCommander) => {
    return parentPostKey ? p.hincrby(parentPostKey, 'replyCount', 1) : undefined
  }
}

export function addToMentionedUsersNotification(post: {
  id: string
  publishedById: string
  createdAt: Date
  mentions: {
    userId: string
  }[]
}) {
  return post.mentions.map((mention) => {
    if (mention.userId === post.publishedById) {
      return (p: ChainableCommander) => undefined
    }

    const mentionedUserKey = getKeys(mention.userId).userDetailsKey
    const timestamp = moment(post.createdAt).unix()
    const { notificationActivityKey, notificationsKey } = getNotificationKeys(
      mention.userId,
      {
        type: 'mention',
        actorId: post.publishedById,
        data: {
          postId: post.id,
        },
        timestamp,
      }
    )

    return (p: ChainableCommander) =>
      p.addNotification(
        mentionedUserKey,
        notificationsKey,
        timestamp,
        notificationActivityKey
      )
  })
}

export function incrementParentNotification(post: {
  id: string
  publishedById: string
  createdAt: Date
  parentPost?: {
    id: string
    publishedById: string
  }
}) {
  if (!post.parentPost || post.parentPost.publishedById == post.publishedById) {
    return (p: ChainableCommander) => undefined
  }

  const { userDetailsKey } = getKeys(post.parentPost.publishedById)
  const timestamp = moment(post.createdAt).unix()
  const { notificationActivityKey, notificationsKey } = getNotificationKeys(
    post.parentPost.publishedById,
    {
      type: 'reply',
      actorId: post.publishedById,
      data: {
        postId: post.id,
      },
      object: {
        postId: post.parentPost.id,
      },
      timestamp,
    }
  )

  return (p: ChainableCommander) =>
    p.addNotification(
      userDetailsKey,
      notificationsKey,
      timestamp,
      notificationActivityKey
    )
}

export function addToRepliesTimeline(post: {
  id: string
  publishedById: string
  createdAt: Date
  parentPost?: {
    id: string
  }
}) {
  const { repliesKey } = getKeys(post.publishedById)
  const likeOrRepostKey = getPostEmbeddedKey(post.id, post.publishedById)

  return (p: ChainableCommander) => {
    //If a reply, add post to replies timeline for poster, otherwise add to user's main timeline
    return !!post.parentPost?.id
      ? p.zadd(repliesKey, -moment(post.createdAt).unix(), likeOrRepostKey)
      : undefined
  }
}

export function addToAllPostsTimeline(post: {
  id: string
  publishedById: string
  createdAt: Date
  monetization?: {
    id: string
  } | null
}) {
  const allPostsKey = getAllPostsKey()
  const postKey = getPostEmbeddedKey(post.id, post.publishedById)

  return (p: ChainableCommander) => {
    //If a reply, add post to replies timeline for poster, otherwise add to user's main timeline
    return p.zadd(allPostsKey, -moment(post.createdAt).unix(), postKey)
  }
}

export function addToCampaignTimeline(post: {
  id: string
  publishedById: string
  createdAt: Date
  monetization?: {
    id: string
  } | null
}) {
  const allCampaignsKey = getAllCampaignsKey()
  const postKey = getPostEmbeddedKey(post.id, post.publishedById)

  return (p: ChainableCommander) => {
    //If a reply, add post to replies timeline for poster, otherwise add to user's main timeline
    return !!post.monetization?.id
      ? p.zadd(allCampaignsKey, -moment(post.createdAt).unix(), postKey)
      : undefined
  }
}

export function addToUserCampaignTimeline(post: {
  id: string
  publishedById: string
  createdAt: Date
  monetization?: {
    id: string
  } | null
}) {
  const { campaignKey } = getKeys(post.publishedById)
  const postKey = getPostEmbeddedKey(post.id, post.publishedById)

  return (p: ChainableCommander) => {
    //If a reply, add post to replies timeline for poster, otherwise add to user's main timeline
    return !!post.monetization?.id
      ? p.zadd(campaignKey, -moment(post.createdAt).unix(), postKey)
      : undefined
  }
}

export function addToMediaTimeline(post: {
  id: string
  publishedById: string
  createdAt: Date
  content: Doc
  mediaUrls?: { url: string; height: number; width: number }[]
}) {
  const { mediaKey } = getKeys(post.publishedById)
  const likeOrRepostKey = getPostEmbeddedKey(post.id, post.publishedById)

  const hasMedia =
    post.content.content
      .filter(
        (content): content is Extract<typeof content, { type: 'media' }> =>
          content.type === 'media'
      )
      .map((media) => media.attrs.id).length > 0 || post.mediaUrls?.length

  return (p: ChainableCommander) => {
    return hasMedia
      ? p.zadd(mediaKey, -moment(post.createdAt).unix(), likeOrRepostKey)
      : undefined
  }
}

export function addToFollowersTimeline(post: {
  id: string
  publishedById: string
  repostedById?: string
  createdAt: Date
}) {
  const { followersKey } = getKeys(post.repostedById || post.publishedById)

  const embeddedPostKey = getPostEmbeddedKey(
    post.id,
    post.publishedById,
    post.repostedById
  )

  return (p: ChainableCommander) => {
    return p.addPostToFollowersTimeline(
      embeddedPostKey,
      followersKey,
      (-moment(post.createdAt).unix()).toString()
    )
  }
}

export function deletePost(post: {
  id: string
  publishedById: string
  repostedById?: string
  createdAt: Date
}) {
  const postKey = getPostKey(post.id, post.publishedById)

  return (p: ChainableCommander) => {
    return post.repostedById ? undefined : p.hset(postKey, 'deleted', 1)
  }
}

export function removeFromHomeTimeline(post: {
  id: string
  publishedById: string
  repostedById?: string
  createdAt: Date
}) {
  const { homeTimelineKey } = getKeys(post.repostedById || post.publishedById)

  const embeddedPostKey = getPostEmbeddedKey(
    post.id,
    post.publishedById,
    post.repostedById
  )

  return (p: ChainableCommander) => {
    return p.zrem(homeTimelineKey, embeddedPostKey)
  }
}

export function removeFromUserTimeline(post: {
  id: string
  publishedById: string
  repostedById?: string
  createdAt: Date
}) {
  const { userTimelineKey } = getKeys(post.repostedById || post.publishedById)

  const embeddedPostKey = getPostEmbeddedKey(
    post.id,
    post.publishedById,
    post.repostedById
  )

  return (p: ChainableCommander) => {
    return p.zrem(userTimelineKey, embeddedPostKey)
  }
}

export function removeFromFollowersTimeline(post: {
  id: string
  publishedById: string
  repostedById?: string
  createdAt: Date
}) {
  const { followersKey } = getKeys(post.repostedById || post.publishedById)

  const embeddedPostKey = getPostEmbeddedKey(
    post.id,
    post.publishedById,
    post.repostedById
  )

  return (p: ChainableCommander) => {
    return p.removePostFromFollowersTimeline(embeddedPostKey, followersKey)
  }
}
