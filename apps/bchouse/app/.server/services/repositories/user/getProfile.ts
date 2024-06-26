import { Kysely } from 'kysely'
import { jsonArrayFrom } from 'kysely/helpers/mysql'
import { DB, db } from '../../db/index'
import { BasicUserProfile, UserProfile } from './types'

export async function getUserId({ username }: { username: string }) {
  return await db
    .selectFrom('User as user')
    .where('user.username', '=', username)
    .select('id as userId')
    .executeTakeFirstOrThrow()
}

export async function getUserProfile(
  db: Kysely<DB>,
  params: { id: string }
): Promise<UserProfile> {
  const { id } = params
  const userRow = await db
    .selectFrom('User as user')
    .where('user.id', '=', id)
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

  const user = {
    id,
    username: userRow.username,
    firstName: userRow.firstName,
    lastName: userRow.lastName,
    fullName: [userRow.firstName, userRow.lastName]
      .filter(Boolean)
      .join(' ')
      .trim(),
    about: userRow.about,
    avatarUrl: userRow.avatarUrl,
    coverPhotoUrl: userRow.coverPhotoUrl,
    website: userRow.website,
    email: userRow.email,
    company: userRow.company,
    title: userRow.title,
    bchAddress: userRow.bchAddress,
    createdAt: userRow.createdAt,
    location: userRow.location,
    updatedAt: userRow.updatedAt,
    isAdmin: Boolean(userRow.isAdmin || false),
  }

  return {
    ...user,
    updates: [] as {
      id: string
    }[],
    activity: [] as {
      id: string
      person: {
        id: string
        avatarUrl: string
        name: string
        handle: string
      }
      href: string
      type: string
    }[],
  }
}

export async function getBasicUserProfile(
  db: Kysely<DB>,
  params: {
    username: string
    currentUserId: string | null
  }
): Promise<BasicUserProfile> {
  const { username, currentUserId } = params

  const userRow = await db
    .selectFrom('User as user')
    .where('user.username', '=', username)
    .select([
      'user.id',
      'user.username',
      'user.firstName',
      'user.lastName',
      'user.about',
      'user.avatarUrl',
      'user.coverPhotoUrl',
      'user.website',
      'user.email',
      'user.company',
      'user.title',
      'user.bchAddress',
      'user.createdAt',
      'user.location',
      'user.updatedAt',
      (qb) =>
        qb
          .exists((qb) =>
            qb
              .selectFrom('Follows as follows')
              .select('follows.id')
              .where('followerId', '=', currentUserId)
              .whereRef('follows.followedId', '=', 'user.id')
          )
          .$castTo<boolean>()
          .as('isCurrentUserFollowing'),
      (qb) =>
        qb
          .selectFrom('Follows as follow')
          .whereRef('follow.followerId', '=', 'user.id')
          .select((qb) => qb.fn.count('follow.id').as('followingCount'))
          .as('followingCount'),
      (qb) =>
        qb
          .selectFrom('Follows as follow')
          .whereRef('follow.followedId', '=', 'user.id')
          .select((qb) => qb.fn.count('follow.id').as('followerCount'))
          .as('followerCount'),
      (qb) =>
        jsonArrayFrom(
          qb
            .selectFrom('Media as media')
            .innerJoin('Post as post', 'post.id', 'media.postId')
            .whereRef('post.publishedById', '=', 'user.id')
            .where('post.deleted', '!=', 1)
            .orderBy(['media.createdAt desc', 'media.id asc'])
            .select([
              'media.url',
              'media.idx',
              'media.postId',
              'media.width',
              'media.height',
              'post.publishedById as authorId',
            ])
            .limit(6)
        ).as('mediaItems'),
    ])
    .limit(1)
    .executeTakeFirst()

  if (!userRow) {
    throw new Error(`User with id ${username} not found`)
  }

  const user = {
    id: userRow.id,
    username: userRow.username,
    fullName: [userRow.firstName, userRow.lastName]
      .filter(Boolean)
      .join(' ')
      .trim(),
    about: userRow.about,
    avatarUrl: userRow.avatarUrl,
    coverPhotoUrl: userRow.coverPhotoUrl,
    website: userRow.website,
    email: userRow.email,
    company: userRow.company,
    title: userRow.title,
    bchAddress: userRow.bchAddress,
    joinedDate: userRow.createdAt,
    location: userRow.location,
    updatedAt: userRow.updatedAt,
    followingCount: userRow.followingCount as number,
    followerCount: userRow.followerCount as number,

    mediaPreviewUrls: userRow.mediaItems
      .map((row) => row.url)
      .filter(Boolean)
      .reverse(),

    mediaPreviewItems: userRow.mediaItems.filter(Boolean).reverse(),
  }

  const profile = {
    ...user,
    isCurrentUser: currentUserId === user.id,
    isCurrentUserFollowing: Boolean(userRow.isCurrentUserFollowing),
    activity: [],
    announcements: [],
  }

  return profile
}

export async function getBasicUserProfileById(
  db: Kysely<DB>,
  params: {
    userId: string
    currentUserId: string | null
  }
): Promise<BasicUserProfile> {
  const { userId, currentUserId } = params

  const userRow = await db
    .selectFrom('User as user')
    .where('user.id', '=', userId)
    .select([
      'user.id',
      'user.username',
      'user.firstName',
      'user.lastName',
      'user.about',
      'user.avatarUrl',
      'user.coverPhotoUrl',
      'user.website',
      'user.email',
      'user.company',
      'user.title',
      'user.bchAddress',
      'user.createdAt',
      'user.location',
      'user.updatedAt',
      (qb) =>
        qb
          .exists((qb) =>
            qb
              .selectFrom('Follows as follows')
              .select('follows.id')
              .where('followerId', '=', currentUserId)
              .whereRef('follows.followedId', '=', 'user.id')
          )
          .$castTo<boolean>()
          .as('isCurrentUserFollowing'),
      (qb) =>
        qb
          .selectFrom('Follows as follow')
          .whereRef('follow.followerId', '=', 'user.id')
          .select((qb) => qb.fn.count('follow.id').as('followingCount'))
          .as('followingCount'),
      (qb) =>
        qb
          .selectFrom('Follows as follow')
          .whereRef('follow.followedId', '=', 'user.id')
          .select((qb) => qb.fn.count('follow.id').as('followerCount'))
          .as('followerCount'),
      (qb) =>
        jsonArrayFrom(
          qb
            .selectFrom('Media as media')
            .innerJoin('Post as post', 'post.id', 'media.postId')
            .whereRef('post.publishedById', '=', 'user.id')
            .where('post.deleted', '!=', 1)
            .orderBy(['media.createdAt desc', 'media.id asc'])
            .select([
              'media.url',
              'media.idx',
              'media.postId',
              'media.width',
              'media.height',
              'post.publishedById as authorId',
            ])
            .limit(6)
        ).as('mediaItems'),
    ])
    .executeTakeFirst()

  if (!userRow) {
    throw new Error(`User with id ${userId} not found`)
  }

  const user = {
    id: userRow.id,
    username: userRow.username,
    fullName: [userRow.firstName, userRow.lastName]
      .filter(Boolean)
      .join(' ')
      .trim(),
    about: userRow.about,
    avatarUrl: userRow.avatarUrl,
    coverPhotoUrl: userRow.coverPhotoUrl,
    website: userRow.website,
    email: userRow.email,
    company: userRow.company,
    title: userRow.title,
    bchAddress: userRow.bchAddress,
    joinedDate: userRow.createdAt,
    location: userRow.location,
    updatedAt: userRow.updatedAt,
    followingCount: userRow.followingCount as number,
    followerCount: userRow.followerCount as number,
    mediaPreviewUrls: userRow.mediaItems
      .map((row) => row.url)
      .filter(Boolean)
      .reverse(),
    mediaPreviewItems: userRow.mediaItems.filter(Boolean).reverse(),
  }

  const profile = {
    ...user,
    isCurrentUser: currentUserId === user.id,
    isCurrentUserFollowing: Boolean(userRow.isCurrentUserFollowing),
    activity: [],
    announcements: [],
  }

  return profile
}
