import { db, User } from '../../db/index'
import {
  getBasicUserProfile,
  getBasicUserProfileById,
  getUserProfile,
} from './getProfile'
import { getUserExists } from './getUserExists'
import { getAllUserFollows, getUserFollows } from './getUserFollows'
import { getUserMentions, getUserNotifications } from './getUserNotifications'
import {
  BasicUserProfile,
  IUserRepo,
  MinimalProfile,
  Notification,
  PostTypeNotification,
  UpdateUserReturn,
  UserProfile,
} from './types'

export class UserRepo implements IUserRepo {
  async userExists(params: { userId: string }) {
    return getUserExists(params)
  }

  async deleteUserWebhook({ userId }: { userId: string }) {
    return await db.deleteFrom('User').where('id', '=', userId).execute()
  }

  async createUserWebhook(params: {
    userId: string
    username: string
    avatarUrl?: string
    email?: string
    firstName?: string | null
    lastName?: string | null
  }) {
    const { userId, username, avatarUrl, email, firstName, lastName } = params

    return await db
      .insertInto('User')
      .values({
        updatedAt: new Date(),
        username,
        avatarUrl,
        email,
        firstName,
        lastName,
        id: userId,
        lastActiveAt: new Date(),
      })
      .execute()
  }

  async updateUserWebhook(params: {
    userId: string
    username: string
    avatarUrl?: string
    email?: string
    firstName?: string | null
    lastName?: string | null
  }) {
    const { userId, username, avatarUrl, email, firstName, lastName } = params

    return await db
      .updateTable('User')
      .where('id', '=', userId)
      .set({
        updatedAt: new Date(),
        username,
        avatarUrl,
        email,
        firstName,
        lastName,
        id: userId,
      })
      .execute()
  }

  async getAllUsers() {
    const query = db
      .selectFrom('User as user')
      .select([
        'user.id',
        'user.firstName',
        'user.lastName',
        'user.about',
        'user.username',
        'user.website',
        'user.company',
        'user.location',
        'user.avatarUrl',
        'user.coverPhotoUrl',
        'user.createdAt',
        'user.title',
      ])
      .groupBy(['user.id'])
      .compile()

    const result = await db.executeQuery(query)
    return result.rows
  }

  async getIsCurrentUser(params: {
    username: string
    currentUserId: string | null
  }) {
    return db
      .selectFrom('User')
      .where('User.username', '=', params.username)
      .select('User.id')
      .executeTakeFirst()
      .then((row) => row?.id === params.currentUserId)
  }

  async getBchAddress(params: { username: string }) {
    return db
      .selectFrom('User')
      .where(({ cmpr, and }) =>
        and([
          cmpr('User.username', '=', params.username),
          cmpr('User.bchAddress', 'is not', null),
        ])
      )
      .select('User.bchAddress')
      .executeTakeFirstOrThrow()
      .then((row) => row.bchAddress as string)
  }

  async getFollowers(params: {
    username: string
    currentUserId: string | null
  }): Promise<MinimalProfile[]> {
    return getUserFollows(db, { ...params, type: 'followers' })
  }

  async getAllUserFollows(params: {
    id: string
    currentUserId: string | null
  }): Promise<(MinimalProfile & { createdAt: Date })[]> {
    return getAllUserFollows(db, { ...params, type: 'followers' })
  }

  async getFollowing(params: {
    username: string
    currentUserId: string | null
  }): Promise<MinimalProfile[]> {
    return getUserFollows(db, { ...params, type: 'following' })
  }

  async getUserProfile(params: { id: string }): Promise<UserProfile> {
    return getUserProfile(db, params)
  }

  async getBasicUserProfile(params: {
    username: string
    currentUserId: string | null
  }): Promise<BasicUserProfile> {
    return getBasicUserProfile(db, params)
  }

  async getBasicUserProfileById(params: {
    userId: string
    currentUserId: string | null
  }): Promise<BasicUserProfile> {
    return getBasicUserProfileById(db, params)
  }

  async getUserNotifications(params: {
    id: string | null
  }): Promise<Notification[]> {
    return getUserNotifications(params)
  }

  async getUserMentions(params: {
    id: string | null
  }): Promise<PostTypeNotification[]> {
    return getUserMentions(params)
  }

  async updateUser(params: {
    userId: string
    user: Omit<Partial<User>, 'coverPhotoUrl' | 'avatarPhotoUrl'> & {
      coverPhotoId?: string
      avatarId?: string
    }
  }): Promise<UpdateUserReturn> {
    const { userId, user } = params

    await db
      .updateTable('User')
      .where('id', '=', userId)
      .set({
        firstName: user.firstName,
        lastName: user.lastName,
        about: user.about,
        avatarUrl: user.avatarId,
        coverPhotoUrl: user.coverPhotoId,
        website: user.website,
        company: user.company,
        title: user.title,
        location: user.location,
        bchAddress: user.bchAddress,
        updatedAt: new Date(),
      })
      .execute()

    return await db
      .selectFrom('User')
      .where('id', '=', userId)
      .selectAll()
      .executeTakeFirstOrThrow()
      .then((row) => ({
        ...row,
        isAdmin: !!row.__isAdmin,
      }))
  }

  async getUserAccount(params: { id: string }): Promise<UpdateUserReturn> {
    const { id } = params
    return await db
      .selectFrom('User as user')
      .where('id', '=', id)
      .select([
        'user.__isAdmin as isAdmin',
        'user.about',
        'user.avatarUrl',
        'user.bchAddress',
        'user.company',
        'user.coverPhotoUrl',
        'user.createdAt',
        'user.email',
        'user.firstName',
        'user.lastName',
        'user.location',
        'user.title',
        'user.updatedAt',
        'user.username',
        'user.website',
        'user.id',
      ])
      .executeTakeFirstOrThrow()
      .then((row) => {
        return { ...row, isAdmin: !!row.isAdmin }
      })
  }

  async followUser(params: {
    userId: string
    followedId: string
  }): Promise<void> {
    const { userId, followedId } = params
    await db
      .insertInto('Follows')
      .values({ followerId: userId, followedId })
      .ignore()
      .execute()
  }

  async unfollowUser(params: {
    userId: string
    followedId: string
  }): Promise<void> {
    const { userId, followedId } = params

    await db
      .deleteFrom('Follows')
      .where(({ and, cmpr }) =>
        and([
          cmpr('followerId', '=', userId),
          cmpr('followedId', '=', followedId),
        ])
      )
      .execute()
  }

  async getUserIsAdmin(params: { userId: string }): Promise<boolean> {
    const { userId } = params
    return await db
      .selectFrom('User')
      .where('id', '=', userId)
      .select('__isAdmin as isAdmin')
      .executeTakeFirstOrThrow()
      .then((row) => !!row.isAdmin)
  }
}

export const userRepo = new UserRepo()
export default userRepo
