import {
  DeletedObjectJSON,
  UserJSON,
  createClerkClient,
} from '@clerk/clerk-sdk-node'
import { prettyPrintSats } from '~/utils/prettyPrintSats'
import { KyselyPostDbModel } from '../repositories/posts/types'
import userRepo from '../repositories/user'
import { blockUser, unblockUser } from '../repositories/user/blockUser'
import { getUserId } from '../repositories/user/getProfile'
import { muteUser, unmuteUser } from '../repositories/user/muteUser'
import { updateLastViewedNotifications } from '../repositories/user/updateLastViewedNotifications'
import {
  getDailyActiveUserCount,
  getWeeklyActiveUserCount,
  updateUserLastActive,
} from '../repositories/user/userActivity'
import { detectAddressNetwork } from '../utils/bchUtils'
import moment from '../utils/moment'
import { Doc } from '../utils/tiptapSchema'
import { RedisService } from './redis'
import { SearchService } from './search'
import { PostCardModel } from './types'

type NotificationType =
  | 'MENTION'
  | 'LIKE'
  | 'REPLY'
  | 'REPOST'
  | 'FOLLOW'
  | 'ACCEPTED_INVITE'
  | 'DONATION'
  | 'TIP'
type NotificationStatus = 'UNREAD' | 'READ'

type BaseNotification = {
  key: string
  href: string
  type: NotificationType
  status: NotificationStatus
  createdAt: Date
  viewed: boolean
}

type MentionNotification = BaseNotification & {
  type: 'MENTION'
  post: PostCardModel
}

type LikeNotification = BaseNotification & {
  type: 'LIKE'
  user: {
    name: string
    handle: string
    avatarUrl: string
  }
}

type TipNotification = BaseNotification & {
  type: 'TIP'
  user: {
    name: string | null
    handle: string | null
    avatarUrl: string | null
  }
  tippedAmount: number
}

type ReplyNotification = BaseNotification & {
  type: 'REPLY'
  post: PostCardModel
}

type RepostNotification = BaseNotification & {
  type: 'REPOST'
  user: {
    name: string
    handle: string
    avatarUrl: string
  }
}

type FollowNotification = BaseNotification & {
  type: 'FOLLOW'
  user: {
    id: string
    name: string
    handle: string
    avatarUrl: string
  }
}

type DonationNotification = BaseNotification & {
  type: 'DONATION'
  donor: {
    id: string
    name: string
    username: string
  }
  amount: number
}

// MENTION: Tom Sawyer mentioned you in a post
// MENTION: Tom Sawyer and Joe Schmoe mentioned you in a post
// MENTION: Tom Sawyer and 3 others mentioned you in a post

// LIKE: Tom Sawyer liked your post
// LIKE: Tom Sawyer and Joe Schmoe liked your post
// LIKE: Tom Sawyer and 3 others liked your post
// LIKE: Tom Sawyer liked 2 of your posts

// LIKE: Tom Sawyer liked a post you were mentioned in
// LIKE: Tom Sawyer and Joe Schmoe liked a post you were mentioned in
// LIKE: Tom Sawyer and 3 others liked a post you were mentioned in
// LIKE: Tom Sawyer liked 2 posts you were mentioned in

// REPLY: (Just show post) subheading: Replying to Your Name
// REPLY: (Just show post) subheading: Replying to Your Name and @JoeSchmoe
// REPLY: (Just show post) subheading: Replying to Your Name and 3 others

// REPOST: Tom Sawyer reposted your post
// REPOST: Tom Sawyer and Joe Schmoe reposted your post
// REPOST: Tom Sawyer and 3 others reposted your post
// REPOST: Tom Sawyer reposted 2 of your posts

// FOLLOW: Tom Sawyer followed you
// FOLLOW: Tom Sawyer and Joe Schmoe followed you
// FOLLOW: Tom Sawyer and 3 others followed you

const notificationMessageTemplates = {
  MENTION: (notification: MentionNotification) =>
    `${notification.post.person.name} mentioned you in a post`,
  LIKE: (notification: LikeNotification) =>
    `${notification.user.name} liked your post`,
  TIP: (notification: TipNotification) => {
    const [amount, denomination] = prettyPrintSats(notification.tippedAmount)

    return `${
      notification.user.name || 'Anonymous'
    } tipped your post ${amount}${denomination}`
  },
  REPLY: (notification: ReplyNotification) =>
    `${notification.post.person.name} replied to your post`,
  REPOST: (notification: RepostNotification) =>
    `${notification.user.name} reposted your post`,
  FOLLOW: (notification: FollowNotification) =>
    `${notification.user.name} followed you`,
  DONATION: (notification: DonationNotification) =>
    `${notification.donor.name} donated ${notification.amount} to you`,
}

export const getNotificationMessage = (
  notification:
    | MentionNotification
    | LikeNotification
    | ReplyNotification
    | RepostNotification
    | FollowNotification
    | DonationNotification
    | TipNotification
) => {
  switch (notification.type) {
    case 'MENTION':
      return notificationMessageTemplates.MENTION(notification)
    case 'LIKE':
      return notificationMessageTemplates.LIKE(notification)
    case 'TIP':
      return notificationMessageTemplates.TIP(notification)
    case 'REPLY':
      return notificationMessageTemplates.REPLY(notification)
    case 'REPOST':
      return notificationMessageTemplates.REPOST(notification)
    case 'FOLLOW':
      return notificationMessageTemplates.FOLLOW(notification)
    case 'DONATION':
      return notificationMessageTemplates.DONATION(notification)
  }
}

function postToViewModel(post: KyselyPostDbModel) {
  const postVm: PostCardModel = {
    deleted: post.deleted || false,
    id: post.id,
    type: 'comment',
    key: post.id,
    repostedBy: undefined,
    wasReposted: post._computed.wasReposted,
    wasLiked: post._computed.wasLiked,
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
    viewCount: 1,
    likeCount: post._count.likes,
    repostCount: post._count.reposts + post._count.quotePosts,
    tipAmount: post._count.tipAmount,
    wasTipped: post._computed.wasTipped,
    embed: post.embed,
    isBlocked: post.isBlocked,
    isMuted: post.isMuted,
    isFollowed: post.isFollowed,

    //TODO: Resolve mentions, hashtags, and media links
    mediaUrls: post.mediaUrls || [],
    avatarUrl: post.publishedBy.avatarUrl,
    content: post.content as Doc,
    date: moment(post.createdAt).fromNow(),
    isThread: false,
    publishedById: post.publishedById,
    quoteCount: post._count.quotePosts,
  }

  return postVm
}

export class UserService {
  constructor(
    readonly redisService: RedisService,
    readonly searchService: SearchService
  ) {}

  async getUserId({ username }: { username: string }) {
    return getUserId({ username })
  }

  async deleteAccountWebhook(user: DeletedObjectJSON) {
    if (!user.id) return

    await userRepo.deleteUserWebhook({
      userId: user.id,
    })
  }

  async updateAccountWebhook(user: UserJSON) {
    await userRepo.updateUserWebhook({
      userId: user.id,
      username: user.username || user.id,
      avatarUrl: user.image_url as string,
      email:
        user.email_addresses.find((e) => e.id === user.primary_email_address_id)
          ?.email_address || user.email_addresses[0]?.email_address,
      firstName: user.first_name,
      lastName: user.last_name,
    })

    await this.searchService.upsertUser({
      id: user.id,
      user_avatarUrl: user.image_url,
      user_createdAt: moment.unix(user.created_at).toDate(),
      user_fullname: [user.first_name, user.last_name]
        .filter(Boolean)
        .join(' '),
      user_username: user.username as string,
    })

    await this.redisService.updateUserFromDb(user.id)
  }

  async createAccountWebhook(user: UserJSON) {
    const exists = await userRepo.userExists({ userId: user.id })

    if (exists) {
      return
    }

    await userRepo.createUserWebhook({
      userId: user.id,
      username: user.username || user.id,
      avatarUrl: user.image_url as string,
      email:
        user.email_addresses.find((e) => e.id === user.primary_email_address_id)
          ?.email_address || user.email_addresses[0]?.email_address,
      firstName: user.first_name,
      lastName: user.last_name,
    })

    await this.searchService.upsertUser({
      id: user.id,
      user_avatarUrl: user.image_url,
      user_createdAt: moment.unix(user.created_at).toDate(),
      user_fullname: [user.first_name, user.last_name]
        .filter(Boolean)
        .join(' '),
      user_username: user.username as string,
    })

    await this.redisService.updateUserFromDb(user.id)
  }

  async createAccountRedirect(userId: string) {
    const exists = await userRepo.userExists({ userId })

    if (exists) {
      return
    }

    const user = await createClerkClient({
      secretKey: process.env.CLERK_SECRET_KEY as string,
    }).users.getUser(userId)

    await userRepo.createUserWebhook({
      userId: user.id,
      username: user.username || user.id,
      avatarUrl: user.imageUrl as string,
      email:
        user.emailAddresses.find((e) => e.id === user.primaryEmailAddressId)
          ?.emailAddress || user.emailAddresses[0]?.emailAddress,
      firstName: user.firstName,
      lastName: user.lastName,
    })

    await this.searchService.upsertUser({
      id: user.id,
      user_avatarUrl: user.imageUrl,
      user_createdAt: moment.unix(user.createdAt).toDate(),
      user_fullname: [user.firstName, user.lastName].filter(Boolean).join(' '),
      user_username: user.username as string,
    })

    await this.redisService.updateUserFromDb(userId)
  }

  async updateAccountActivity(id: string) {
    await updateUserLastActive({ id })
  }

  async getUserCounts() {
    const clerkClient = createClerkClient({
      secretKey: process.env.CLERK_SECRET_KEY as string,
    })

    const [userCount, dailyActiveUserCount, weeklyActiveUserCount] =
      await Promise.all([
        clerkClient.users.getCount(),
        getDailyActiveUserCount(),
        getWeeklyActiveUserCount(),
      ])

    return { userCount, dailyActiveUserCount, weeklyActiveUserCount }
  }

  async addMute(userId: string, mutedUserId: string) {
    if (userId === mutedUserId) return
    if (await muteUser({ userId: userId, mutedUserId })) {
      await this.redisService.addMute(userId, mutedUserId)
    }
  }

  async removeMute(userId: string, mutedUserId: string) {
    if (await unmuteUser({ userId: userId, mutedUserId })) {
      await this.redisService.removeMute(userId, mutedUserId)
    }
  }

  async addBlock(userId: string, blockedUserId: string) {
    if (userId === blockedUserId) return
    if (await blockUser({ userId: userId, blockedUserId })) {
      await this.redisService.addBlock(userId, blockedUserId)
    }
  }

  async removeBlock(userId: string, blockedUserId: string) {
    if (await unblockUser({ userId: userId, blockedUserId })) {
      await this.redisService.removeBlock(userId, blockedUserId)
    }
  }

  async updateLastViewedNotifications(userId: string) {
    const wasUpdated = await updateLastViewedNotifications({ userId })
    if (wasUpdated) {
      await this.redisService.clearNotifications(userId)
    }

    return wasUpdated
  }

  async getMentions(userId: string) {
    const mentions = await userRepo.getUserMentions({
      id: userId,
    })

    return mentions.map((mention) => {
      const notificationVm = {
        key: mention.key,
        href: mention.href,
        createdAt: mention.createdAt,
        status: mention.status,
        type: mention.type,
        post:
          postToViewModel({
            ...mention.sourcePost,
            key: 'REPLY:' + mention.sourcePost.id,
            mediaUrls: [],
            publishedById: mention.sourceUser.id,
            replies: [],
          }) || '',
        viewed: mention.viewed,
      } as MentionNotification

      return {
        notification: notificationVm,
        message: getNotificationMessage(notificationVm),
      }
    })
  }

  async getNotifications(userId: string) {
    return await this.redisService.getNotifications(userId, true)
  }
}
