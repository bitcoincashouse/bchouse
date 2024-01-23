import Redis, { ChainableCommander } from 'ioredis'
import { z } from 'zod'
import { logger } from '../../app/utils/logger.js'
import { Network } from '../db/types.js'
import postRepo from '../repositories/posts/index.js'
import { Cursor } from '../repositories/types.js'
import userRepo from '../repositories/user/index.js'
import { UserProfile } from '../repositories/user/types.js'
import { detectAddressNetwork } from '../utils/bchUtils.js'
import moment from '../utils/moment.js'
import { serializeCursor } from '../utils/serializeCursor.js'
import { type Doc } from '../utils/tiptapSchema.js'
import {
  FeedKeys,
  getAllCampaignsKey,
  getAllPostsKey,
  getKeys,
  getPostEmbeddedKey,
  getPostKey,
  getTimelineKey,
  parsePostEmbeddedKey,
} from './redis/keys.js'
import { PipelineHandler } from './redis/pipeline.js'
import * as postCache from './redis/post.js'
import { getNResults } from './redis/utils.js'
import type { PostCardModel } from './types.js'

export function getRedis() {
  return new RedisService()
}

declare module 'ioredis' {
  interface Redis {
    addPostToFollowersTimeline(
      postKey: string,
      followersKey: string,
      score: string
    ): Promise<string>
    removePostFromFollowersTimeline(
      postKey: string,
      followersKey: string
    ): Promise<string>
  }

  interface ChainableCommander {
    addPostToFollowersTimeline(
      postKey: string,
      followersKey: string,
      score: string
    ): Promise<string>
    removePostFromFollowersTimeline(
      postKey: string,
      followersKey: string
    ): Promise<string>
  }
}

export class RedisService extends Redis {
  constructor() {
    super(process.env.REDIS_URL as string)

    // Load the Lua script into Redis
    this.defineCommand('addPostToFollowersTimeline', {
      numberOfKeys: 2,
      lua: `
      local postKey = KEYS[1]
      local followersKey = KEYS[2]
      local score = tonumber(ARGV[1]) -- Parse the score from ARGV

      local followers = redis.call('ZRANGE', followersKey, 0, -1)
      
      for i, follower in ipairs(followers) do
          local timelineKey = "timeline:home:user:" .. follower
          redis.call('ZADD', timelineKey, score, postKey)
      end
      
      return "OK"
    `,
    })

    this.defineCommand('removePostFromFollowersTimeline', {
      numberOfKeys: 2,
      lua: `
      local postKey = KEYS[1]
      local followersKey = KEYS[2]

      local followers = redis.call('ZRANGE', followersKey, 0, -1)
      
      for i, follower in ipairs(followers) do
          local timelineKey = "timeline:home:user:" .. follower
          redis.call('ZREM', timelineKey, postKey)
      end
      
      return "OK"
    `,
    })
  }

  async getRedisStatus() {
    return z
      .enum(['built', 'building', 'idle'])
      .nullable()
      .transform((val) => (val === null ? 'idle' : val))
      .parse(await this.get('redis:status'))
  }

  async setRedisStatus(status: 'built' | 'building') {
    await this.set('redis:status', status)
  }

  //Rebuilding
  async updateUser(user: {
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
  }) {
    const { userDetailsKey } = getKeys(user.id)

    const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ')

    const profile = {
      id: user.id,
      username: user.username,
      displayName: user.firstName || user.username,
      avatarUrl: user.avatarUrl,

      fullName: fullName || user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      about: user.about,
      email: user.email,
      company: user.company,
      title: user.title,

      createdDate: moment(user.createdAt).unix(),
      updatedAt: moment(user.updatedAt).unix(),

      name: fullName || user.username,
      url: user.website,
      coverPhotoUrl: user.coverPhotoUrl,
      bchAddress: user.bchAddress,
    }

    this.hset(userDetailsKey, profile)
  }

  async updateUserFollowers(
    userId: string,
    followers: Array<{
      followerId: string
      createdAt: Date
    }>
  ) {
    const { followersKey } = getKeys(userId)

    const followerMembers = followers
      .map((follower) => [
        -moment(follower.createdAt).unix(),
        follower.followerId,
      ])
      .flat()

    if (followerMembers.length) this.zadd(followersKey, ...followerMembers)
  }

  async updateUserMutes(userId: string, mutes: Array<string>) {
    const { mutesKey } = getKeys(userId)
    if (mutes.length) this.sadd(mutesKey, ...mutes)
  }

  async updateUserBlocking(userId: string, blockedUsers: Array<string>) {
    const { userBlockingKey } = getKeys(userId)
    if (blockedUsers.length) this.sadd(userBlockingKey, ...blockedUsers)
  }

  async updateUserBlockedBy(userId: string, blockedUsers: Array<string>) {
    const { userBlockedByKey } = getKeys(userId)
    if (blockedUsers.length) this.sadd(userBlockedByKey, ...blockedUsers)
  }

  async updateUserHomeTimeline(
    userId: string,
    posts: Array<{
      id: string
      publishedById: string
      repostedById: string | undefined
      createdAt: Date
    }>
  ) {
    const timelineKey = getTimelineKey(userId, 'home')

    const members = posts
      .map((post) => [
        -moment(post.createdAt).unix(),
        getPostEmbeddedKey(post.id, post.publishedById, post.repostedById),
      ])
      .flat()

    if (members.length) this.zadd(timelineKey, ...members)
  }

  async updateUserTimeline(
    userId: string,
    posts: Array<{
      id: string
      publishedById: string
      repostedById: string | undefined
      createdAt: Date
    }>
  ) {
    const timelineKey = getTimelineKey(userId, 'user')

    const members = posts
      .map((post) => [
        -moment(post.createdAt).unix(),
        getPostEmbeddedKey(post.id, post.publishedById, post.repostedById),
      ])
      .flat()

    if (members.length) this.zadd(timelineKey, ...members)
  }

  async updateUserRepostTimeline(
    userId: string,
    reposts: Array<{
      postId: string
      publishedById: string
      createdAt: Date
    }>
  ) {
    let { retweetsKey } = getKeys(userId)

    const repostMembers = reposts
      .map((repost) => [
        -moment(repost.createdAt).unix(),
        getPostEmbeddedKey(repost.postId, repost.publishedById),
      ])
      .flat()

    if (repostMembers.length) this.zadd(retweetsKey, ...repostMembers)
  }

  async updateUserLikeTimeline(
    userId: string,
    likes: Array<{
      postId: string
      publishedById: string
      createdAt: Date
    }>
  ) {
    let { likesKey } = getKeys(userId)
    const likeMembers = likes
      .map((like) => [
        -moment(like.createdAt).unix(),
        getPostEmbeddedKey(like.postId, like.publishedById),
      ])
      .flat()

    if (likeMembers.length) this.zadd(likesKey, ...likeMembers)
  }

  async updateUserMediaTimeline(
    userId: string,
    mediaPosts: Array<{
      postId: string
      publishedById: string
      createdAt: Date
    }>
  ) {
    let { mediaKey } = getKeys(userId)
    const members = mediaPosts
      .map((post) => [
        -moment(post.createdAt).unix(),
        getPostEmbeddedKey(post.postId, post.publishedById),
      ])
      .flat()

    if (members.length) this.zadd(mediaKey, ...members)
  }

  async updateUserReplyTimeline(
    userId: string,
    replies: Array<{
      postId: string
      publishedById: string
      createdAt: Date
    }>
  ) {
    let { repliesKey } = getKeys(userId)
    const members = replies
      .map((reply) => [
        -moment(reply.createdAt).unix(),
        getPostEmbeddedKey(reply.postId, reply.publishedById),
      ])
      .flat()

    if (members.length) this.zadd(repliesKey, ...members)
  }

  async updateUserTipsTimeline(
    userId: string,
    posts: Array<{
      postId: string
      publishedById: string
      createdAt: Date
    }>
  ) {
    let { tipsKey } = getKeys(userId)
    const members = posts
      .map((post) => [
        -moment(post.createdAt).unix(),
        getPostEmbeddedKey(post.postId, post.publishedById),
      ])
      .flat()

    if (members.length) this.zadd(tipsKey, ...members)
  }

  async updateUserCampaignTimeline(
    userId: string,
    campaigns: Array<{
      postId: string
      publishedById: string
      createdAt: Date
    }>
  ) {
    let { campaignKey } = getKeys(userId)
    const members = campaigns
      .map((campaign) => [
        -moment(campaign.createdAt).unix(),
        getPostEmbeddedKey(campaign.postId, campaign.publishedById),
      ])
      .flat()

    if (members.length) this.zadd(campaignKey, ...members)
  }

  async updatePosts(
    posts: Array<{
      id: string
      publishedById: string
      createdAt: Date
      content: unknown
      mediaUrls: {
        url: string
        height: number
        width: number
      }[]
      deleted: boolean
      embed?: string | null | undefined
      replyCount: number
      repostCount: number
      likeCount: number
      tipAmount: number
      parentPost?: {
        id: string
        publishedById: string
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
  ) {
    const allCampaignsKey = getAllCampaignsKey()
    const allPostsKey = getAllPostsKey()

    await Promise.all(
      posts.map((post) => {
        const postKey = getPostKey(post.id, post.publishedById)
        const postEmbeddedKey = getPostEmbeddedKey(post.id, post.publishedById)

        return Promise.all([
          this.hset(postKey, {
            id: post.id,
            publishedById: post.publishedById,
            replyCount: post.replyCount,
            repostCount: post.repostCount,
            likeCount: post.likeCount,
            viewCount: 1,
            tipAmount: post.tipAmount,
            deleted: post.deleted ? 0 : 1,

            date: moment(post.createdAt).unix(),

            //TODO: Resolve mentions, hashtags, and media links
            mediaUrls:
              post.mediaUrls
                ?.map(({ url, height, width }) => `${url}:${height}:${width}`)
                .join(',') || [],
            content: JSON.stringify(post.content),
            isThread: false,
            embed: post.embed,

            parent_post_id: post.parentPost?.id,
            parent_post_publishedById: post.parentPost?.publishedById,

            monetization_id: post.monetization?.id,
            monetization_amount: post.monetization?.amount,
            monetization_address: post.monetization?.address,
            monetization_expires: post.monetization?.expiresAt,
            monetization_title: post.monetization?.title,
            monetization_network: post.monetization?.network,
            monetization_version: post.monetization?.version,
          }),
          this.zadd(
            allPostsKey,
            -moment(post.createdAt).unix(),
            postEmbeddedKey
          ),
          post.monetization?.id
            ? this.zadd(
                allCampaignsKey,
                -moment(post.createdAt).unix(),
                postEmbeddedKey
              )
            : Promise.resolve(),
        ])
      })
    )
  }

  //Real-time
  async updateUserFromDb(currentUserId: string) {
    const { userDetailsKey } = getKeys(currentUserId)

    await userRepo.getUserProfile({ id: currentUserId }).then((user) => {
      const profile = {
        id: currentUserId,
        username: user.username,
        displayName: user.fullName || user.username,
        avatarUrl: user.avatarUrl,

        fullName: user.fullName || user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        about: user.about,
        email: user.email,
        company: user.company,
        title: user.title,

        createdDate: moment(user.createdAt).unix(),
        updatedAt: moment(user.updatedAt).unix(),

        name: user.fullName || user.username,
        url: user.website,
        coverPhotoUrl: user.coverPhotoUrl,

        activity: user.activity,
        updates: user.updates,
        bchAddress: user.bchAddress,
      }

      this.hset(userDetailsKey, profile)
    })
  }

  async updateUserFollowersFromDb(currentUserId: string) {
    const { followersKey } = getKeys(currentUserId)

    await userRepo
      .getAllUserFollows({ id: currentUserId, currentUserId })
      .then((followers) => {
        const followerMembers = followers
          .map((follower) => [-moment(follower.createdAt).unix(), follower.id])
          .flat()

        if (followerMembers.length) this.zadd(followersKey, ...followerMembers)
      })
  }

  async updateUserLikesFromDb(currentUserId: string) {
    const { likesKey } = getKeys(currentUserId)
    await postRepo.getAllUserLikes({ userId: currentUserId }).then((likes) => {
      const likeMembers = likes
        .map((like) => [-moment(like.createdAt).unix(), like.id])
        .flat()

      if (likeMembers.length) this.zadd(likesKey, ...likeMembers)
    })
  }

  async updateUserRepostsFromDb(currentUserId: string) {
    const { retweetsKey } = getKeys(currentUserId)
    await postRepo
      .getAllUserRetweets({ userId: currentUserId })
      .then((retweets) => {
        const retweetMembers = retweets
          .map((retweet) => [-moment(retweet.createdAt).unix(), retweet.id])
          .flat()

        if (retweetMembers.length) this.zadd(retweetsKey, ...retweetMembers)
      })
  }

  async initialize(currentUserId: string) {
    const { isInitialized } = getKeys(currentUserId)
    if (!(await this.get(isInitialized))) {
      await this.updateUserFromDb(currentUserId)
      await this.updateUserFollowersFromDb(currentUserId)
      // await this.updateUserLikesFromDb(currentUserId)
      // await this.updateUserRepostsFromDb(currentUserId)

      await this.set(isInitialized, 1)
    }
  }

  async clearNotifications(userId: string) {
    const { userDetailsKey } = getKeys(userId)
    await PipelineHandler(this.pipeline())(
      (p) => p.hset(userDetailsKey, 'notificationCount', 0),
      (p) => p.hset(userDetailsKey, 'lastViewedNotifications', moment().unix())
    )
  }

  async getUserProfile(userId: string) {
    const { userDetailsKey } = getKeys(userId)
    const [profile] = await Promise.all([this.hgetall(userDetailsKey)])

    if (!profile) return undefined

    const profileVm = {
      id: profile.id as string,
      username: profile.username as string,
      fullName: profile.fullName || (profile.username as string),
      firstName: profile.firstName,
      lastName: profile.lastName,
      about: profile.about || null,
      email: profile.email || null,
      company: profile.company || null,
      title: profile.title || null,
      joinedDate: moment.unix(Number(profile.createdDate)).toDate(),
      name: profile.name || null,
      url: profile.url || null,
      avatarUrl: profile.avatarUrl || null,
      backgroundImage: profile.backgroundImage || null,
      coverPhotoUrl: profile.coverPhotoUrl || null,
      notificationCount: Number(profile.notificationCount || 0),
      isAdmin: profile.isAdmin === 'true' || Boolean(Number(profile.isAdmin)),
    }

    return {
      ...profileVm,
      website: profile.url || null,
      bchAddress: profile.bchAddress || null,
      activity: [],
      createdAt: profileVm.joinedDate,
      location: profile.location || null,
      updatedAt: moment.unix(Number(profile.updatedAt)).toDate(),
      updates: [],
      logoutLink: '',
      profile: profileVm,
      homeView: {
        ...profileVm,
        isCurrentUser: true,
        isMember: true,
        activity: profile.activity || [],
        updates: profile.updates,
        website: profile.website,
        bchAddress: profile.bchAddress,
      },
    } as UserProfile
  }

  async addUserToHomeTimeline(params: {
    followerId: string
    followedId: string
  }) {
    //Add followed user's user timeline to follower's home timeline
    const followedUserTimelineKey = getTimelineKey(params.followedId, 'user')
    const followerUserTimelineKey = getTimelineKey(params.followerId, 'home')
    const followedPostMembersWithScores = await this.zrange(
      followedUserTimelineKey,
      0,
      -1,
      'WITHSCORES'
    )
    const followedPostScoresWithMembers = []
    for (let i = 0; i < followedPostMembersWithScores.length; i += 2) {
      followedPostScoresWithMembers.push(
        parseInt(followedPostMembersWithScores[i + 1] as string),
        followedPostMembersWithScores[i] as string
      )
    }

    await this.zadd(followerUserTimelineKey, ...followedPostScoresWithMembers)
  }

  async removeUserFromHomeTimeline(params: {
    followerId: string
    followedId: string
  }) {
    //Add followed user's user timeline to follower's home timeline
    const followedUserTimelineKey = getTimelineKey(params.followedId, 'user')
    const followerHomeTimelineKey = getTimelineKey(params.followerId, 'home')
    const followedPostMembers = await this.zrange(
      followedUserTimelineKey,
      0,
      -1
    )

    await this.zrem(followerHomeTimelineKey, ...followedPostMembers)
  }

  async addMute(userId: string, mutedUserId: string) {
    let { mutesKey } = getKeys(userId)

    await PipelineHandler(this.pipeline())((p) =>
      p.sadd(mutesKey, -moment().unix(), mutedUserId)
    )
  }

  async removeMute(userId: string, mutedUserId: string) {
    let { mutesKey } = getKeys(userId)

    await PipelineHandler(this.pipeline())((p) => p.srem(mutesKey, mutedUserId))
  }

  async addBlock(userId: string, blockedUserId: string) {
    let { userBlockedByKey } = getKeys(userId)
    let { userBlockingKey } = getKeys(blockedUserId)

    await PipelineHandler(this.pipeline())(
      (p) => p.sadd(userBlockingKey, -moment().unix(), blockedUserId),
      (p) => p.sadd(userBlockedByKey, -moment().unix(), userId)
    )
  }

  async removeBlock(userId: string, blockedUserId: string) {
    let { userBlockedByKey } = getKeys(userId)
    let { userBlockingKey } = getKeys(blockedUserId)

    await PipelineHandler(this.pipeline())(
      (p) => p.srem(userBlockingKey, blockedUserId),
      (p) => p.srem(userBlockedByKey, userId)
    )
  }

  //Pipelining
  async addLike(userId: string, postId: string, publishedById: string) {
    let { likesKey } = getKeys(userId)
    const likeOrRepostKey = getPostEmbeddedKey(postId, publishedById)
    const { userDetailsKey } = getKeys(publishedById)

    await PipelineHandler(this.pipeline())(
      (p) => p.zadd(likesKey, -moment().unix(), likeOrRepostKey),
      (p) => p.hincrby(getPostKey(postId, publishedById), 'likeCount', 1),
      (p) =>
        publishedById !== userId
          ? p.hincrby(userDetailsKey, 'notificationCount', 1)
          : undefined
    )
  }

  async removeLike(userId: string, postId: string, publishedById: string) {
    let { likesKey } = getKeys(userId)
    const likeOrRepostKey = getPostEmbeddedKey(postId, publishedById)
    const { userDetailsKey } = getKeys(publishedById)

    const lastViewedNotificationsStr = await this.hget(
      userDetailsKey,
      'lastViewedNotifications'
    )
    const lastViewedNotifications = lastViewedNotificationsStr
      ? moment.unix(Number(lastViewedNotificationsStr))
      : undefined
    const likeAddedStr = await this.zscore(likesKey, likeOrRepostKey)
    const likeAdded = likeAddedStr
      ? moment.unix(Math.abs(Number(likeAddedStr)))
      : undefined

    await PipelineHandler(this.pipeline())(
      (p) => p.zrem(likesKey, likeOrRepostKey),
      (p) => p.hincrby(getPostKey(postId, publishedById), 'likeCount', -1),
      (p) => {
        //If like was added after user last viewed (user hasn't viewed the notification) decrement the notification count
        if (
          likeAdded &&
          publishedById !== userId &&
          (!lastViewedNotifications || likeAdded > lastViewedNotifications)
        ) {
          return p.hincrby(userDetailsKey, 'notificationCount', -1)
        }

        return undefined
      }
    )
  }

  async addRepost(postId: string, publishedById: string, userId: string) {
    let { retweetsKey } = getKeys(userId)
    const likeOrRepostKey = getPostEmbeddedKey(postId, publishedById)
    const { userDetailsKey } = getKeys(publishedById)

    await PipelineHandler(this.pipeline())(
      (p) => p.zadd(retweetsKey, -moment().unix(), likeOrRepostKey),
      (p) => p.hincrby(getPostKey(postId, publishedById), 'repostCount', 1),
      (p) =>
        publishedById !== userId
          ? p.hincrby(userDetailsKey, 'notificationCount', 1)
          : undefined
    )
  }

  async removeRepost(postId: string, publishedById: string, userId: string) {
    let { retweetsKey } = getKeys(userId)
    const likeOrRepostKey = getPostEmbeddedKey(postId, publishedById)
    const { userDetailsKey } = getKeys(publishedById)

    const lastViewedNotificationsStr = await this.hget(
      userDetailsKey,
      'lastViewedNotifications'
    )
    const lastViewedNotifications = lastViewedNotificationsStr
      ? moment.unix(Number(lastViewedNotificationsStr))
      : undefined
    const repostAddedStr = await this.zscore(retweetsKey, likeOrRepostKey)
    const repostAdded = repostAddedStr
      ? moment.unix(Math.abs(Number(repostAddedStr)))
      : undefined

    await PipelineHandler(this.pipeline())(
      (p) => p.zrem(retweetsKey, likeOrRepostKey),
      (p) => p.hincrby(getPostKey(postId, publishedById), 'repostCount', -1),
      (p) => {
        //If repost was added after user last viewed (user hasn't viewed the notification) decrement the notification count
        if (
          repostAdded &&
          publishedById !== userId &&
          (!lastViewedNotifications || repostAdded > lastViewedNotifications)
        ) {
          return p.hincrby(userDetailsKey, 'notificationCount', -1)
        }

        return undefined
      }
    )
  }

  async addFollow(params: { followerId: string; followedId: string }) {
    const { userDetailsKey, followersKey } = getKeys(params.followedId)
    await Promise.all([
      this.zadd(followersKey, -moment().unix(), params.followerId),
      this.hincrby(userDetailsKey, 'notificationCount', 1),
      this.addUserToHomeTimeline(params),
    ])
  }

  async removeFollow(params: { followerId: string; followedId: string }) {
    const { userDetailsKey, followersKey } = getKeys(params.followedId)

    //Get followAdded before removing
    const followAddedStr = await this.zscore(followersKey, params.followerId)

    await Promise.all([
      this.zrem(followersKey, params.followerId),
      this.hget(userDetailsKey, 'lastViewedNotifications').then(
        async (lastViewedNotificationsStr) => {
          const lastViewedNotifications = lastViewedNotificationsStr
            ? moment.unix(Number(lastViewedNotificationsStr)).toDate()
            : undefined
          const followAdded = followAddedStr
            ? moment.unix(Math.abs(Number(followAddedStr))).toDate()
            : undefined

          if (
            followAdded &&
            (!lastViewedNotifications || followAdded > lastViewedNotifications)
          ) {
            await this.hincrby(userDetailsKey, 'notificationCount', -1)
          }
        }
      ),
      await this.removeUserFromHomeTimeline(params),
    ])
  }

  async addTip(tip: {
    id: string
    tipUserId?: string | null
    publishedById: string
    createdAt: Date
    tipAmount: number
  }) {
    const postKey = getPostKey(tip.id, tip.publishedById)
    const embeddedPostKey = getPostEmbeddedKey(tip.id, tip.publishedById)
    const { tipsKey = undefined } = tip.tipUserId ? getKeys(tip.tipUserId) : {}
    const { userDetailsKey } = getKeys(tip.publishedById)

    return await Promise.all([
      tipsKey
        ? this.zadd(tipsKey, -moment(tip.createdAt).unix(), embeddedPostKey)
        : Promise.resolve(),
      this.hincrby(postKey, 'tipAmount', tip.tipAmount),
      tip.publishedById !== tip.tipUserId
        ? this.hincrby(userDetailsKey, 'notificationCount', 1)
        : null,
    ])
  }

  async addPost(post: {
    id: string
    publishedById: string
    content: Doc
    createdAt: Date
    audienceType: 'PUBLIC' | 'CIRCLE' | 'CHILD'
    mediaUrls?: {
      url: string
      height: number
      width: number
    }[]
    parentPost?: {
      id: string
      publishedById: string
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
    mentions: { userId: string }[]
  }) {
    await PipelineHandler(this.pipeline())(
      postCache.setPost({
        ...post,
        createdAt: moment().toDate(),
        replyCount: 0,
        repostCount: 0,
        likeCount: 0,
        tipAmount: 0,
      }),
      postCache.addToHomeTimeline(post),
      postCache.addToUserTimeline(post),
      postCache.addToRepliesTimeline(post),
      postCache.addToMediaTimeline(post),
      postCache.incrementParentReplies(post),
      postCache.incrementParentNotification(post),
      postCache.addToAllPostsTimeline(post),
      postCache.addToCampaignTimeline(post),
      postCache.addToUserCampaignTimeline(post),
      ...post.mentions.map((mention) => {
        const mentionedUserKey = getKeys(mention.userId).userDetailsKey

        return (p: ChainableCommander) => {
          return mentionedUserKey && mention.userId !== post.publishedById
            ? p.hincrby(mentionedUserKey, 'notificationCount', 1)
            : undefined
        }
      })
    )
  }

  async postToTimeline(
    postId: string,
    publishedById: string,
    repostedById?: string
  ) {
    const createdAt = new Date()

    await PipelineHandler(this.pipeline())(
      //Add to user timeline only if a retweet (non-retweets are added to user/home/etc. timeline on creation)
      repostedById
        ? postCache.addToHomeTimeline({
            id: postId,
            publishedById,
            repostedById,
            createdAt,
          })
        : () => undefined,
      //Add to user timeline only if a retweet (non-retweets are added to user/home/etc. timeline on creation)
      repostedById
        ? postCache.addToUserTimeline({
            id: postId,
            publishedById,
            repostedById,
            createdAt,
          })
        : () => undefined,
      postCache.addToFollowersTimeline({
        id: postId,
        publishedById,
        repostedById,
        createdAt,
      })
    )
  }

  async removeFromTimeline(
    postId: string,
    publishedById: string,
    repostedById?: string
  ) {
    const createdAt = new Date()
    await PipelineHandler(this.pipeline())(
      postCache.removeFromHomeTimeline({
        id: postId,
        publishedById,
        repostedById,
        createdAt,
      }),
      postCache.removeFromUserTimeline({
        id: postId,
        publishedById,
        repostedById,
        createdAt,
      }),
      postCache.removeFromFollowersTimeline({
        id: postId,
        publishedById,
        repostedById,
        createdAt,
      }),
      postCache.deletePost({
        id: postId,
        publishedById,
        repostedById,
        createdAt,
      })
    )
  }

  async hasTimeline(id: string, type: FeedKeys) {
    const timelineKey = getTimelineKey(id, type)
    const exists = await this.exists(timelineKey)
    return exists
  }

  async getTimeline(
    id: string,
    currentUserId: string | null,
    type: FeedKeys,
    cursor: Cursor | undefined
  ) {
    const timelineKey = getTimelineKey(id, type)
    const {
      mutesKey = undefined,
      userBlockingKey = undefined,
      userBlockedByKey = undefined,
    } = currentUserId ? getKeys(currentUserId) : {}

    const limit = 20
    const mutedUserIds =
      mutesKey &&
      (type === 'all_posts' || type === 'all_campaigns' || type === 'home')
        ? await this.smembers(mutesKey)
        : undefined

    const blockedUserIds =
      userBlockingKey &&
      (type === 'all_posts' || type === 'all_campaigns' || type === 'home')
        ? await this.smembers(userBlockingKey)
        : undefined

    const blockedByUserIds =
      userBlockedByKey &&
      (type === 'all_posts' || type === 'all_campaigns' || type === 'home')
        ? await this.smembers(userBlockedByKey)
        : undefined

    const filterUserPosts = ([] as string[]).concat(
      mutedUserIds || [],
      blockedUserIds || [],
      blockedByUserIds || []
    )

    console.log({
      filterUserPosts,
      mutedUserIds,
      currentUserId,
      mutesKey,
      type,
    })

    try {
      const { results: postIds, nextCursor } = await getPostPage(
        this,
        timelineKey,
        cursor,
        limit
      )

      const feedResult = (
        await Promise.all(
          postIds.map(async (embeddedKey) => {
            const { postId, publishedById, repostedById } =
              parsePostEmbeddedKey(embeddedKey)

            //TODO: Since we need to grab parent author, could fetch all posts and then fetch all child cache items in a second pipeline.
            return await PipelineHandler(this.pipeline())(
              postCache.getPost({ postId, publishedById }),
              postCache.getPostAuthor({ publishedById }),
              postCache.getIsLikedByCurrentUser({
                currentUserId,
                postId,
                publishedById,
              }),
              postCache.getIsRetweetedByCurrentUser({
                currentUserId,
                postId,
                publishedById,
              }),
              postCache.getIsTippedByCurrentUser({
                currentUserId,
                postId,
                publishedById,
              }),
              postCache.getRepostedBy({ repostedById }),
              postCache.getIsMutedByCurrentUser({
                currentUserId,
                publishedById,
              }),
              postCache.getIsBlockedByCurrentUser({
                currentUserId,
                publishedById,
              })
            ).then(
              async ([
                post,
                author,
                isLikedByCurrentUser,
                isRepostedByCurrentUser,
                isTippedByCurrentUser,
                repostedBy,
                isMutedByCurrentUser,
                isBlockedByCurrentUser,
              ]) => {
                return mapRedisPostToPostCard(embeddedKey, {
                  post,
                  author,
                  isLikedByCurrentUser,
                  isRepostedByCurrentUser,
                  isTippedByCurrentUser,
                  repostedBy,
                  parentAuthor: await (post.parent_post_publishedById
                    ? postCache.getPostAuthor({
                        publishedById: post.parent_post_publishedById,
                      })(this)
                    : null),
                  isMutedByCurrentUser,
                  isBlockedByCurrentUser,
                })
              }
            )
          })
        )
      ).filter(
        (p) =>
          !p.deleted &&
          !p.isBlocked &&
          //Only mute if not on user's page
          !(
            p.isMuted &&
            (type === 'home' ||
              type === 'all_posts' ||
              type === 'all_campaigns')
          )
      )

      const seenPostIds = new Set<string>()
      const feed = [] as PostCardModel[]
      for (let i = feedResult.length - 1; i >= 0; i--) {
        const item = feedResult[i] as NonNullable<(typeof feedResult)[number]>
        if (item?.deleted || seenPostIds.has(item.id)) continue
        seenPostIds.add(item.id)
        feed.push(item)
      }

      feed.reverse()

      return {
        posts: feed,
        nextCursor: nextCursor,
      }
    } catch (err) {
      logger.error('Error', err)
      throw err
    }
  }

  async getPosts(
    posts: Array<{
      id: string
      publishedById: string
    }>,
    currentUserId: string | null
  ) {
    return (
      await Promise.all(
        posts.map(async ({ id: postId, publishedById }) => {
          const embeddedKey = getPostEmbeddedKey(postId, publishedById)

          return await PipelineHandler(this.pipeline())(
            postCache.getPost({ postId, publishedById }),
            postCache.getPostAuthor({ publishedById }),
            postCache.getIsLikedByCurrentUser({
              currentUserId,
              postId,
              publishedById,
            }),
            postCache.getIsRetweetedByCurrentUser({
              currentUserId,
              postId,
              publishedById,
            }),
            postCache.getIsTippedByCurrentUser({
              currentUserId,
              postId,
              publishedById,
            }),
            postCache.getIsMutedByCurrentUser({
              currentUserId,
              publishedById,
            }),
            postCache.getIsBlockedByCurrentUser({
              currentUserId,
              publishedById,
            })
          ).then(
            async ([
              post,
              author,
              isLikedByCurrentUser,
              isRepostedByCurrentUser,
              isTippedByCurrentUser,
              isMutedByCurrentUser,
              isBlockedByCurrentUser,
            ]) => {
              return mapRedisPostToPostCard(embeddedKey, {
                post,
                author,
                isLikedByCurrentUser,
                isRepostedByCurrentUser,
                isTippedByCurrentUser,
                repostedBy: undefined,
                parentAuthor: await (post.parent_post_publishedById
                  ? postCache.getPostAuthor({
                      publishedById: post.parent_post_publishedById,
                    })(this)
                  : null),
                isMutedByCurrentUser,
                isBlockedByCurrentUser,
              })
            }
          )
        })
      )
    ).filter((p) => !p.deleted && !p.isBlocked) as PostCardModel[]
  }
}

function mapRedisPostToPostCard(
  key: string,
  {
    post: redisPost,
    author: redisAuthor,
    isLikedByCurrentUser: redisIsLikedByCurrentUser,
    isRepostedByCurrentUser: redisIsRepostedByCurrentUser,
    isTippedByCurrentUser: redisIsTippedByCurrentUser,
    repostedBy: redisRepostedBy,
    parentAuthor: redisParentAuthor,
    isMutedByCurrentUser: redisIsMutedByCurrentUser,
    isBlockedByCurrentUser: redisIsBlockedByCurrentUser,
  }: {
    post: any
    author: any
    isLikedByCurrentUser: any
    isRepostedByCurrentUser: any
    isTippedByCurrentUser: any

    isMutedByCurrentUser: any
    isBlockedByCurrentUser: any
    repostedBy: any
    parentAuthor: any
  }
) {
  const { postId, publishedById } = parsePostEmbeddedKey(key)

  const post = redisPost as {
    id: string
    mediaUrls: string
    replyCount: string
    repostCount: string
    quoteCount: string
    tipAmount: string
    name: string
    handle: string
    likeCount: string
    viewCount: string
    deleted: string
    content: string
    date: string
    isThread: string
    avatarUrl: string
    embed?: string

    parent_post_id?: string | null
    parent_post_publishedById?: string | null

    monetization_id?: string
    monetization_amount?: string
    monetization_address?: string
    monetization_expires?: string
    monetization_title?: string
    monetization_network?: string
    monetization_version?: number
  }

  const author = redisAuthor as {
    id: string
    username: string
    avatarUrl: string
    displayName: string
    bchAddress?: string | null
  }

  const parentAuthor = redisParentAuthor as {
    id: string
    username: string
    avatarUrl: string
    displayName: string
  }

  const deleted = Boolean(Number(post.deleted || 0)) || post.deleted === 'true'

  if (deleted) {
    return {
      key,
      id: postId,
      deleted: true as const,
    }
  }

  return {
    id: postId,
    publishedById,
    key: key,
    deleted: false as const,
    type: 'comment',
    mediaUrls:
      post.mediaUrls
        ?.split(',')
        .filter(Boolean)
        .map((media) => {
          const [url, height, width] = media.split(':')
          if (!url || !height || !width) return undefined
          return {
            url,
            height: Number(height),
            width: Number(width),
          }
        })
        .filter(Boolean) || [],
    repostedBy: redisRepostedBy || undefined,
    wasLiked: !!redisIsLikedByCurrentUser,
    wasReposted: !!redisIsRepostedByCurrentUser,
    wasTipped: !!redisIsTippedByCurrentUser,
    isBlocked: !!redisIsBlockedByCurrentUser,
    isMuted: !!redisIsMutedByCurrentUser,
    person: {
      name: author.displayName,
      href: '#',
      handle: author.username,
      bchAddress: author.bchAddress,
      network: author.bchAddress
        ? detectAddressNetwork(author.bchAddress)
        : null,
    },
    parentPost:
      post.parent_post_id && parentAuthor
        ? {
            id: post.parent_post_id,
            handle: parentAuthor.username,
            name: parentAuthor.displayName,
            publishedById: parentAuthor.id,
          }
        : null,
    replyCount: Number(post.replyCount),
    quoteCount: Number(post.quoteCount),
    repostCount: Number(post.repostCount),
    likeCount: Number(post.likeCount),
    viewCount: Number(post.viewCount),
    tipAmount: Number(post.tipAmount),
    avatarUrl: author.avatarUrl,
    content: parseContent(post.content),
    date: moment.unix(Number(post.date)).fromNow(),
    isThread: false,
    embed: post.embed,
    monetization:
      post.monetization_id &&
      post.monetization_address &&
      post.monetization_amount &&
      post.monetization_expires &&
      post.monetization_network
        ? {
            campaignId: post.monetization_id || '',
            amount: Number(post.monetization_amount),
            address: post.monetization_address,
            expiresAt: moment.unix(Number(post.monetization_expires)).toDate(),
            title: post.monetization_title || '',
            network: post.monetization_network as Network,
            version: post.monetization_version || 0,
          }
        : undefined,
  } as PostCardModel
}

function parseContent(content: string): Doc {
  try {
    if (content) {
      return JSON.parse(content) as Doc
    }
  } catch (err) {}

  return {
    type: 'doc',
    content: [
      {
        type: 'paragraph',
        content: [{ type: 'text', text: "Error parsing post's content." }],
      },
    ],
  }
}

async function getPostPage(
  redis: Redis,
  key: string,
  cursor: Cursor | undefined,
  limit: number,
  mutedUserIds?: string[] | null
) {
  const results: string[] = []

  //TODO: iterate until end of timeline or page is filled
  //TODO: convert to lua script using zscan?
  let nextPageCursor =
    typeof cursor !== 'undefined'
      ? {
          score: -moment(cursor.fromTimestamp).unix(),
          member: cursor.fromId,
        }
      : undefined

  let offset = 0
  do {
    await redis
      .zrangebyscore(
        key,
        nextPageCursor?.score || '-inf',
        '+inf',
        'WITHSCORES',
        'LIMIT',
        offset,
        nextPageCursor?.score ? limit + 1 : limit
      )
      .then((postIdMember) => {
        const cursor = nextPageCursor

        //set nextCursor to last score in case limit not reached
        nextPageCursor =
          postIdMember.length > 0
            ? {
                score: Number(postIdMember[postIdMember.length - 1] as string),
                member: postIdMember[postIdMember.length - 2] as string,
              }
            : undefined

        for (
          let i = 0;
          i < postIdMember.length && results.length < limit;
          i += 2
        ) {
          const postId = postIdMember[i] as string
          const score = Number(postIdMember[i + 1] as string)

          if (nextPageCursor && nextPageCursor.score === score) {
            //Increment offset to skip current member if limit not reached
            offset++
          } else {
            //reset offset
            offset = 0
          }

          //Mostly applies to first run when not offset, skip until after timestamp OR greater than cursor id
          if (cursor && cursor.score === score && postId <= cursor.member) {
            continue
          }

          if (!mutedUserIds) {
            results.push(postId)
            continue
          }

          const { publishedById, repostedById } = parsePostEmbeddedKey(postId)
          const muted = mutedUserIds.some(
            (id) => id === publishedById || id === repostedById
          )

          if (!muted) {
            results.push(postId)
            continue
          }
        }
      })
  } while (results.length < limit && nextPageCursor)

  const lastItem = results.length
    ? (results[results.length - 1] as string)
    : undefined

  let nextCursor

  if (lastItem) {
    const { postId } = parsePostEmbeddedKey(lastItem)

    if (postId !== cursor?.fromId) {
      const lastItemScore = (await redis.zscore(key, lastItem)) as string

      nextCursor = serializeCursor({
        fromId: lastItem,
        fromTimestamp: moment.unix(Math.abs(Number(lastItemScore))).toDate(),
      })
    }
  }

  return { results, nextCursor: nextCursor }
}

async function oldGetPostPage(
  redis: Redis,
  key: string,
  cursor: Cursor | undefined,
  limit: number
) {
  let postIds: string[]

  if (!cursor) {
    postIds = await redis.zrangebyscore(key, '-inf', '+inf', 'LIMIT', 0, limit)
  } else {
    const start = -moment(cursor.fromTimestamp).unix()

    const [concurrentPostIds, postIdsPage] = await Promise.all([
      redis.zrangebyscore(key, start, start),
      redis.zrangebyscore(key, `(${start}`, '+inf', 'LIMIT', 0, limit),
    ])

    let cursorItemIndex = -1

    for (let i = 0; i < concurrentPostIds.length; i++) {
      const postId = concurrentPostIds[i] as string
      if (postId === cursor.fromId) {
        //Start next page from next item
        cursorItemIndex = i + 1
        break
      }

      if (postId > cursor.fromId) {
        //Start from current item
        cursorItemIndex = i
        break
      }
    }

    //If last item of previous page not found (or one with same score and further in list lexigraphically), then skip all with same score
    // Otherwise, grab max from both arrays starting from next item or first item with same score and lexigraphically further in list
    postIds =
      cursorItemIndex === -1
        ? postIdsPage
        : getNResults(concurrentPostIds, postIdsPage, limit, cursorItemIndex)
  }

  return postIds
}
