import { Kysely } from 'kysely'
import { DB, db } from '../../db/index'
import { MinimalProfile } from './types'

export async function getUserIsFollowing({
  userId,
  queryUserId,
}: {
  userId: string
  queryUserId: string
}) {
  return db
    .selectFrom('Follows')
    .where((eb) =>
      eb('Follows.followedId', '=', queryUserId).and(
        'Follows.followerId',
        '=',
        userId
      )
    )
    .select(['id'])
    .executeTakeFirst()
    .then((row) => !!row?.id)
}

export async function getUserFollows(
  db: Kysely<DB>,
  params: {
    username: string
    type: 'followers' | 'following'
    currentUserId: string | null
  }
): Promise<MinimalProfile[]> {
  const { username, currentUserId, type } = params

  let result: MinimalProfile[] = []

  const query = db
    .selectFrom('Follows as follow')
    .innerJoin('User as followed', 'followed.id', 'follow.followedId')
    .innerJoin('User as follower', 'follower.id', 'follow.followerId')
    .where(
      type === 'followers' ? 'followed.username' : 'follower.username',
      '=',
      username
    )

  if (type === 'followers') {
    result = await query
      .select([
        'follower.about',
        'follower.avatarUrl',
        'follower.bchAddress',
        'follower.fullName',
        'follower.username',
        'follower.id',
        (qb) =>
          qb
            .eb('follow.followerId', '=', currentUserId)
            .$castTo<boolean>()
            .as('isCurrentUser'),
        (qb) =>
          qb
            .exists((qb) =>
              qb
                .selectFrom('Follows as follows')
                .select('follows.id')
                .where('followerId', '=', currentUserId)
                .whereRef('follows.followedId', '=', 'follower.id')
            )
            .$castTo<boolean>()
            .as('isCurrentUserFollowing'),
      ])

      .execute()
  } else {
    result = await query
      .select([
        'followed.about',
        'followed.avatarUrl',
        'followed.bchAddress',
        'followed.fullName',
        'followed.username',
        'followed.id',
        (qb) =>
          qb
            .eb('follow.followedId', '=', currentUserId)
            .$castTo<boolean>()
            .as('isCurrentUser'),
        (qb) =>
          qb
            .exists((qb) =>
              qb
                .selectFrom('Follows as follows')
                .select('follows.id')
                .where('followerId', '=', currentUserId)
                .whereRef('follows.followedId', '=', 'followed.id')
            )
            .$castTo<boolean>()
            .as('isCurrentUserFollowing'),
      ])
      .execute()
  }

  return result
}

export async function getAllUserFollows(
  db: Kysely<DB>,
  params: {
    id: string
    type: 'followers' | 'following'
    currentUserId: string | null
  }
): Promise<(MinimalProfile & { createdAt: Date })[]> {
  const { id, currentUserId, type } = params

  let result: (MinimalProfile & { createdAt: Date })[] = []

  const query = db
    .selectFrom('Follows as follow')
    .innerJoin('User as followed', 'followed.id', 'follow.followedId')
    .innerJoin('User as follower', 'follower.id', 'follow.followerId')
    .where(type === 'followers' ? 'followedId' : 'followerId', '=', id)

  if (type === 'followers') {
    result = await query
      .select([
        'follower.about',
        'follower.avatarUrl',
        'follower.bchAddress',
        'follower.fullName',
        'follower.username',
        'follower.id',
        'follower.createdAt',
        (qb) =>
          qb
            .eb('follow.followerId', '=', currentUserId)
            .$castTo<boolean>()
            .as('isCurrentUser'),
        (qb) =>
          qb
            .exists((qb) =>
              qb
                .selectFrom('Follows as follows')
                .select('follows.id')
                .where('followerId', '=', currentUserId)
                .whereRef('follows.followedId', '=', 'follower.id')
            )
            .$castTo<boolean>()
            .as('isCurrentUserFollowing'),
      ])

      .execute()
  } else {
    result = await query
      .select([
        'followed.about',
        'followed.avatarUrl',
        'followed.bchAddress',
        'followed.fullName',
        'followed.username',
        'followed.id',
        'followed.createdAt',
        (qb) =>
          qb
            .eb('follow.followedId', '=', currentUserId)
            .$castTo<boolean>()
            .as('isCurrentUser'),
        (qb) =>
          qb
            .exists((qb) =>
              qb
                .selectFrom('Follows as follows')
                .select('follows.id')
                .where('followerId', '=', currentUserId)
                .whereRef('follows.followedId', '=', 'followed.id')
            )
            .$castTo<boolean>()
            .as('isCurrentUserFollowing'),
      ])
      .execute()
  }

  return result
}
