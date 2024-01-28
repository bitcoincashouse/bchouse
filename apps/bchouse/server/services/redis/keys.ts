import { ActivityData, ActivityFactory } from './activity'

export const getPostKey = (postId: string, publishedById: string) =>
  `post:details:${postId}:user:${publishedById}:`

export const getAllCampaignsKey = () => 'all_campaigns'
export const getAllPostsKey = () => 'all_posts'

export type FeedKeys =
  | 'home'
  | 'user'
  | 'likes'
  | 'replies'
  | 'media'
  | 'campaigns'
  | 'tips'
  | 'all_campaigns'
  | 'all_posts'

export const getPostEmbeddedKey = (
  postId: string,
  publishedById: string,
  repostedById?: string
) =>
  `${postId}:${publishedById}${repostedById ? `:${repostedById}:repost` : ''}`

export const parsePostEmbeddedKey = (key: string) => {
  const [postId, publishedById, repostedById] = key.split(':') as [
    string,
    string,
    string | undefined
  ]
  return { postId, publishedById, repostedById }
}

export const getTimelineKey = (id: string, type: FeedKeys) => {
  switch (type) {
    case 'home':
    case 'user':
    case 'likes':
    case 'replies':
    case 'media':
    case 'tips':
    case 'campaigns':
      return `timeline:${type}:user:${id}`
    case 'all_campaigns':
      return 'all_campaigns'
    case 'all_posts':
      return 'all_posts'
  }
}

export const getKeys = (currentUserId: string) => {
  return {
    userDetailsKey: `user:details:${currentUserId}`,
    isInitialized: `user:initialized:${currentUserId}`,
    followersKey: `user:followers:${currentUserId}`,
    homeTimelineKey: `timeline:home:user:${currentUserId}`,
    userTimelineKey: `timeline:user:user:${currentUserId}`,
    repliesKey: `timeline:replies:user:${currentUserId}`,
    mediaKey: `timeline:media:user:${currentUserId}`,
    campaignKey: `timeline:campaigns:user:${currentUserId}`,

    //Also used to find if user liked a post if current user
    likesKey: `timeline:likes:user:${currentUserId}`,
    //Also used to find if user repost a post if current user
    retweetsKey: `timeline:retweets:user:${currentUserId}`,
    tipsKey: `timeline:tips:user:${currentUserId}`,
    mutesKey: `mutes:user:${currentUserId}`,
    userBlockingKey: `user:blocking:${currentUserId}`,
    userBlockedByKey: `user:blocked_by:${currentUserId}`,
    userNotificationsKey: `notifications:user:${currentUserId}`,
  }
}

export const getNotificationKeys = (
  userId: string,
  activityData: ActivityData
) => {
  const { userNotificationsKey: notificationsKey } = getKeys(userId)

  //TODO: Likes, replies, etc. need ids so notificatiions can store a reference
  const activity = ActivityFactory.create(activityData)
  const notificationGroupKey = `${notificationsKey}:${activity.toGroupKey()}`

  return {
    notificationsKey,
    notificationGroupKey,
    notificationActivityKey: activity.toKey(),
  }
}

export const parseNotificationGroup = ({
  groupKey,
  activityKeys,
}: {
  groupKey: string
  activityKeys: string[]
}) => {
  return ActivityFactory.parseGroup(groupKey, activityKeys)
}
