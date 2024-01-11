import { User } from '../../db/index'

export interface IUserRepo {
  getUserProfile(params: { id: string }): Promise<UserProfile>
  getBasicUserProfile(params: {
    username: string
    currentUserId: string
  }): Promise<BasicUserProfile>
  getUserNotifications(params: { id: string }): Promise<Notification[]>
  updateUser(params: {
    userId: string
    user: Omit<Partial<User>, 'coverPhotoUrl' | 'avatarPhotoUrl'> & {
      coverPhotoId?: string
      avatarId?: string
    }
  }): Promise<UpdateUserReturn>
  getUserAccount(params: { id: string }): Promise<UpdateUserReturn>
  getFollowers(params: { username: string }): Promise<MinimalProfile[]>
  getFollowing(params: { username: string }): Promise<MinimalProfile[]>
  followUser(params: { userId: string; followedId: string }): Promise<void>
  unfollowUser(params: { userId: string; followedId: string }): Promise<void>
  getUserIsAdmin(params: { userId: string }): Promise<boolean>
}

export type MinimalProfile = {
  id: string
  username: string
  fullName: string | null
  about: string | null
  avatarUrl: string | null
  bchAddress: string | null
  isCurrentUserFollowing: boolean
  isCurrentUser: boolean
}

export type Profile = {
  id: string
  username: string
  fullName: string | null
  about: string | null
  avatarUrl: string | null
  coverPhotoUrl: string | null
  website: string | null
  email: string | null
  company: string | null
  title: string | null
  bchAddress: string | null
  createdAt: Date
  location: string | null
  updatedAt: Date
  isAdmin: boolean
}

export type UserProfile = Profile & {
  firstName: string | null
  lastName: string | null
} & {
  updates: {
    id: string
  }[]
  activity: {
    id: string
    person: {
      id: string
      avatarUrl: string
      name: string
      handle: string
    }
    href: string
    type: string
  }[]
}

export type BasicUserProfile = {
  id: string
  username: string
  fullName: string | null
  about: string | null
  avatarUrl: string | null
  coverPhotoUrl: string | null
  website: string | null
  email: string | null
  company: string | null
  title: string | null
  bchAddress: string | null
  location: string | null
  updatedAt: Date

  mediaPreviewUrls: string[]

  isCurrentUser: boolean
  joinedDate: Date
  followingCount: number
  followerCount: number
  isCurrentUserFollowing: boolean
  activity: {
    id: string
    person: {
      id: string
      avatarUrl: string
      name: string
      handle: string
    }
    href: string
    type: string
  }[]
  announcements: {
    id: number
    title: string
    href: string
    preview: string
  }[]
}

type BaseNotification = {
  key: string
  href: string
  sourceUser: {
    id: string
    fullName: string
    username: string
    avatarUrl: string
  }
  status: 'UNREAD'
  createdAt: Date
  viewed: boolean
}

export type PostTypeNotification = {
  type: 'REPLY' | 'MENTION' | 'QUOTE'
  sourcePost: {
    id: string
    publishedBy: {
      id: string
      fullName: string
      username: string
      avatarUrl: string
      bchAddress?: string | null
    }
    createdAt: Date
    _count: {
      replies: number
      reposts: number
      quotePosts: number
      likes: number
      tipAmount: number
    }
    _computed: {
      wasLiked: boolean
      repostedBy: undefined
      wasReposted: boolean
      isThread: boolean
      wasTipped: boolean
    }
    content: unknown
    embed: string | null
  }
} & BaseNotification

export type Notification =
  | ({
      type: 'LIKE' | 'REPOST' | 'FOLLOW'
    } & BaseNotification)
  | ({ type: 'TIP'; tippedAmount: number } & BaseNotification)
  | PostTypeNotification

export type UpdateUserReturn = {
  id: string
  createdAt: Date
  updatedAt: Date
  username: string
  isAdmin: boolean | null
  firstName: string | null
  lastName: string | null
  coverPhotoUrl: string | null
  avatarUrl: string | null
  email: string | null
  about: string | null
  website: string | null
  company: string | null
  title: string | null
  location: string | null
  bchAddress: string | null
}

export type NotificationType =
  | 'MENTION'
  | 'LIKE'
  | 'REPLY'
  | 'REPOST'
  | 'FOLLOW'
