import {} from '@clerk/clerk-sdk-node'
import { z } from 'zod'
import { logger } from '../../app/utils/logger'
import moment from '../../app/utils/moment'
import { toDefault } from '../../app/utils/zod'
import userRepo from '../repositories/user'
import { MinimalProfile } from '../repositories/user/types'
import { AuthService } from './auth'
import { setMediaPublic } from './images'
import { RedisService } from './redis'

const baseUserAccountLoaderSchema = z.object({
  id: z.string(),
  username: z.string(),
  fullName: z.string().optional().nullish().transform(toDefault('')),
  firstName: z.string().optional().nullish().transform(toDefault('')),
  lastName: z.string().optional().nullish().transform(toDefault('')),
  about: z.string().optional().nullish().transform(toDefault('')),
  avatarUrl: z.string().optional().nullish().transform(toDefault('')),
  coverPhotoUrl: z.string().optional().nullish().transform(toDefault('')),
  website: z.string().optional().nullish().transform(toDefault('')),
  email: z.string().optional().nullish().transform(toDefault('')),
  company: z.string().optional().nullish().transform(toDefault('')),
  title: z.string().optional().nullish().transform(toDefault('')),
  joinedDate: z.date().optional().nullish().transform(toDefault(new Date())),
  notificationCount: z.number().optional().nullish().transform(toDefault(0)),
  isAdmin: z.boolean().optional().nullish().transform(toDefault(false)),
})

export const userAccountLoaderSchema = baseUserAccountLoaderSchema.transform(
  ({ coverPhotoUrl, avatarUrl, website, ...o }) => {
    const profileVm = {
      name: o.fullName || o.username,
      url: website || '',
      avatarUrl: avatarUrl || '',
      backgroundImage: coverPhotoUrl || '',
      coverPhotoUrl: coverPhotoUrl || '',
      ...o,
      fullName: o.fullName || o.username,
    }

    return profileVm
  }
)
export class ProfileService {
  constructor(
    private readonly redis: RedisService,
    readonly authService: AuthService
  ) {}

  async getProfileById() {}

  async getHomeProfile(userId: string) {
    try {
      const profile = await this.redis.getUserProfile(userId)

      if (profile) {
        const profileVm = userAccountLoaderSchema.parse(profile)
        return {
          logoutLink: '',
          profile: profileVm,
          showOnBoarding: false,
          homeView: {
            ...profileVm,
            isCurrentUser: userId === profile.id,
            isMember: false,
            activity: profile.activity,
            updates: profile.updates,
            website: profile.website,
            bchAddress: profile.bchAddress,
          },
        }
      }
    } catch (err) {
      logger.error('failed to fetch home profile')
    }

    const profile = await userRepo.getUserProfile({
      id: userId,
    })

    const profileVm = userAccountLoaderSchema.parse(profile)

    return {
      logoutLink: '',
      profile: profileVm,
      showOnBoarding: false, //TODO: fetch either from DB or cookie, iA.
      homeView: {
        ...profileVm,
        isCurrentUser: userId === profile.id,
        isMember: false,
        activity: profile.activity,
        updates: profile.updates,
        website: profile.website,
        bchAddress: profile.bchAddress,
      },
    }
  }

  async getProfile(currentUserId: string) {
    const user = await userRepo.getUserProfile({ id: currentUserId })
    const profileVm = userAccountLoaderSchema.parse(user)

    return {
      ...profileVm,
      isCurrentUser: currentUserId === user.id,
      isCurrentUserFollowing: false,
      activity: user.activity,
      updates: user.updates,
    }
  }

  async getBasicProfile(currentUserId: string | null, username: string) {
    const user = await userRepo.getBasicUserProfile({
      username: username,
      currentUserId,
    })

    const profileVm = userAccountLoaderSchema.parse(user)

    return {
      ...profileVm,
      joinedDate: moment(user.joinedDate).format('MMMM YYYY'),
      website: profileVm.url,
      isCurrentUser: user.isCurrentUser,
      isCurrentUserFollowing: user.isCurrentUserFollowing,
      activity: user.activity,
      followerCount: user.followerCount,
      followingCount: user.followingCount,
      announcements: user.announcements,
      bchAddress: user.bchAddress,
      mediaPreview: user.mediaPreviewUrls,
    }
  }

  async getBasicProfileById(currentUserId: string | null, userId: string) {
    const user = await userRepo.getBasicUserProfileById({
      userId,
      currentUserId,
    })

    const profileVm = userAccountLoaderSchema.parse(user)

    return {
      ...profileVm,
      joinedDate: moment(user.joinedDate).format('MMMM YYYY'),
      website: profileVm.url,
      isCurrentUser: user.isCurrentUser,
      isCurrentUserFollowing: user.isCurrentUserFollowing,
      activity: user.activity,
      followerCount: user.followerCount,
      followingCount: user.followingCount,
      announcements: user.announcements,
      bchAddress: user.bchAddress,
      mediaPreview: user.mediaPreviewUrls,
    }
  }

  async getFollowing(
    currentUserId: string | null,
    username: string
  ): Promise<{
    following: MinimalProfile[]
    isCurrentUser: boolean
  }> {
    const [following, isCurrentUser] = await Promise.all([
      userRepo.getFollowing({ username, currentUserId }),
      userRepo.getIsCurrentUser({ currentUserId, username }),
    ])

    return {
      following,
      isCurrentUser,
    }
  }

  async getFollowers(
    currentUserId: string | null,
    username: string
  ): Promise<{
    followers: MinimalProfile[]
    isCurrentUser: boolean
  }> {
    const [followers, isCurrentUser] = await Promise.all([
      userRepo.getFollowers({ username, currentUserId }),
      userRepo.getIsCurrentUser({ currentUserId, username }),
    ])

    return {
      followers,
      isCurrentUser,
    }
  }

  async updateProfile(
    currentUserId: string,
    profile: Partial<{
      about: string
      bchAddress: string
      company: string
      coverPhotoMediaId: string
      location: string
      title: string
      website: string
    }>
  ) {
    const coverPhotoId = await Promise.resolve().then(() =>
      setMediaPublic(profile.coverPhotoMediaId as string)
    )

    const updatedUser = await userRepo.updateUser({
      userId: currentUserId,
      user: {
        ...profile,
        coverPhotoId,
      },
    })

    Promise.resolve().then(() => {
      this.redis.updateUserFromDb(currentUserId)
    })

    return {
      id: updatedUser.id,
      username: updatedUser.username,
      isAdmin: updatedUser.isAdmin || false,
      avatarUrl: updatedUser.avatarUrl || '',
      coverPhotoUrl: updatedUser.coverPhotoUrl || '',
      email: updatedUser.email || '',
      about: updatedUser.about || '',
      website: updatedUser.website || '',
      company: updatedUser.company || '',
      title: updatedUser.title || '',
      location: updatedUser.location || '',
      bchAddress: updatedUser.bchAddress || '',
      createdAt: updatedUser.createdAt,
      updatedAt: updatedUser.updatedAt,
    }
  }

  async addUserFollow(userId: string, followedId: string) {
    await userRepo.followUser({
      userId: userId,
      followedId: followedId,
    })

    await this.redis.addFollow({
      followedId,
      followerId: userId,
    })
  }

  async removeUserFollow(userId: string, followedId: string) {
    await userRepo.unfollowUser({
      userId: userId,
      followedId: followedId,
    })

    await this.redis.removeFollow({
      followedId,
      followerId: userId,
    })
  }
}
