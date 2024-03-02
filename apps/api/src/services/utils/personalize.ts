import {
  PersonalizeEventsClient,
  PutEventsCommand,
} from '@aws-sdk/client-personalize-events'
import {
  GetRecommendationsCommand,
  PersonalizeRuntimeClient,
} from '@aws-sdk/client-personalize-runtime'
import { db } from '../db'

const eventsClient = new PersonalizeEventsClient({
  region: process.env.AWS_REGION as string,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY as string,
    secretAccessKey: process.env.AWS_SECRET as string,
  },
})

const runtimeClient = new PersonalizeRuntimeClient({
  region: process.env.AWS_REGION as string,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY as string,
    secretAccessKey: process.env.AWS_SECRET as string,
  },
})

export async function sendPersonalizeFollowEvent(
  data: {
    followerId: string
    followedId: string
    event: 'follow' | 'unfollow'
  },
  sessionId: string
) {
  const command = new PutEventsCommand({
    eventList: [
      {
        eventType: data.event === 'follow' ? 'followed' : 'unfollowed',
        itemId: data.followedId,
        sentAt: new Date(),
        properties: JSON.stringify({
          followed: Number(data.event === 'follow'),
        }),
      },
    ],
    trackingId: process.env.PERSONALIZE_FOLLOWERS_TRACKING_ID as string,
    userId: data.followerId,
    sessionId,
  })

  await eventsClient.send(command)
}

async function getPopularUnfollowedUsers(currentUserId: string) {
  return await db
    .selectFrom('Follows')
    .groupBy('followedId')
    .where((eb) =>
      eb
        .eb('followedId', '!=', currentUserId)
        .and(
          'followedId',
          'not in',
          eb
            .selectFrom('Follows')
            .where('followerId', '=', currentUserId)
            .select('followedId')
        )
    )
    .select(['followedId', (eb) => eb.fn.count('id').as('followers')])
    .limit(2)
    .orderBy('followers')
    .execute()
    .then((rows) => rows.map((row) => row.followedId))
}

export async function getSimilarUsers(itemId: string, currentUserId: string) {
  if (process.env.NODE_ENV === 'development') {
    return getPopularUnfollowedUsers(currentUserId)
  }

  const command = new GetRecommendationsCommand({
    campaignArn: process.env.PERSONALIZE_SIMILAR_USERS_CAMPAIGN_ARN as string,
    filterArn: process.env.PERSONALIZE_ALREADY_FOLLOWING_FILTER as string,
    //Filter based on currentUserId not following the similar items
    userId: currentUserId,
    itemId,
    numResults: 3,
  })

  const result = await runtimeClient.send(command)

  return (
    result.itemList
      ?.map((list) =>
        list.itemId === itemId || list.itemId === currentUserId
          ? null
          : list.itemId
      )
      .slice(0, 2)
      .filter(Boolean) || []
  )
}

export async function getPersonalizedSuggestions(userId: string) {
  if (process.env.NODE_ENV === 'development') {
    return getPopularUnfollowedUsers(userId)
  }

  const command = new GetRecommendationsCommand({
    campaignArn: process.env.PERSONALIZE_RECOMMEND_USERS_CAMPAIGN_ARN as string,
    filterArn: process.env.PERSONALIZE_ALREADY_FOLLOWING_FILTER as string,
    //Filter based on currentUserId not following the similar items
    userId,
    numResults: 3,
  })

  const result = await runtimeClient.send(command)

  return (
    result.itemList
      ?.map((list) => (list.itemId === userId ? null : list.itemId))
      .slice(0, 2)
      .filter(Boolean) || []
  )
}
