import { inngest, serve } from '@bchouse/inngest'
import { moment } from '@bchouse/utils'
import { createClerkClient } from '@clerk/clerk-sdk-node'
import { db } from '~/services/db'
import { savePledgePayment } from '~/services/repositories/pledge'
import { saveTipPayment } from '~/services/repositories/tip'
import { saveMediaAspectRatios } from '~/services/utils/loadImageAspect'
import {
  getCompletableCampaigns,
  getRefundableCampaigns,
} from '../../repositories/campaign'
import {
  getRedisPostsPaginated,
  getRedisUserBlockedByPaginated,
  getRedisUserBlockingPaginated,
  getRedisUserCampaignPostsPaginated,
  getRedisUserFollowersPaginated,
  getRedisUserHomePostsPaginated,
  getRedisUserLikedPostsPaginated,
  getRedisUserMediaPostsPaginated,
  getRedisUserMutesPaginated,
  getRedisUserNotifications,
  getRedisUserPostsPaginated,
  getRedisUserProfilePaginated,
  getRedisUserReplyPostsPaginated,
  getRedisUserRepostsPaginated,
  getRedisUserTippedPostsPaginated,
} from '../../repositories/redis'
import { Cursor } from '../../repositories/types'
import { CampaignService } from '../campaign'
import { RedisService } from '../redis'

const redisService = new RedisService()

export class InngestService {
  public readonly handler

  constructor({ campaignService }: { campaignService: CampaignService }) {
    this.handler = serve({
      client: inngest,
      functions: [
        //pledge/deposit
        inngest.createFunction(
          { id: 'pledge-deposit' },
          { event: 'pledge/deposit' },
          async ({ event, step }) => {
            //Save payments immediately, send event for pledge success for deduplication/concurrency
            await step.run('handlePledgeSuccess', async () => {
              await savePledgePayment({
                pledgeRequestId: event.data.payment.invoiceId,
                //Invoice
                txid: event.data.payment.txId,
                vout: Number(event.data.payment.vout),
                address: event.data.payment.address,
                satoshis: BigInt(event.data.payment.amount),
                //Pledge specific
                returnAddress: event.data.refundAddress,
                type: event.data.pledgeType,
              })
            })

            await step.sendEvent(
              'pledge-success-' + event.data.payment.invoiceId,
              {
                name: 'pledge/success',
                data: {
                  pledgeRequestId: event.data.payment.invoiceId,
                },
              }
            )

            return { event }
          }
        ),
        //tip/deposit
        inngest.createFunction(
          { id: 'tip-deposit' },
          { event: 'tip/deposit' },
          async ({ event, step }) => {
            //Save deposit
            await step.run('handleTip', async () => {
              const { publishedById: tippedUserId } = await db
                .selectFrom('Post')
                .where('Post.id', '=', event.data.postId)
                .select('publishedById')
                .executeTakeFirstOrThrow()

              await saveTipPayment({
                requestId: event.data.payment.invoiceId,
                txid: event.data.payment.txId,
                vout: Number(event.data.payment.vout),
                address: event.data.payment.address,
                satoshis: BigInt(event.data.payment.amount),
              })

              await redisService.addTip({
                id: event.data.postId,
                createdAt: moment().toDate(),
                tipUserId: event.data.userId,
                publishedById: tippedUserId,
                tipAmount: Number(event.data.payment.amount),
              })
            })
            return { event }
          }
        ),
        //pledge/success
        inngest.createFunction(
          {
            id: 'pledge-success',
            concurrency: {
              limit: 1,
              key: 'event.data.pledgeRequestId',
            },
          },
          { event: 'pledge/success' },
          async ({ event, step }) => {
            await step.run('handlePledgeSuccess', () =>
              campaignService.handlePledgeSuccess(event.data.pledgeRequestId)
            )
            return { event }
          }
        ),
        //pledge/subscribe
        inngest.createFunction(
          {
            id: 'pledge-subscribe',
            rateLimit: {
              limit: 1,
              period: '15s',
              key: 'event.data.id',
            },
          },
          {
            event: 'pledge/subscribe',
          },
          async ({ event }) => {
            await campaignService.handleCampaignSync(
              event.data.id,
              event.data.donationAddress,
              event.data.network
            )
          }
        ),
        //pledge/check-donation
        inngest.createFunction(
          {
            id: 'donation-check',
            rateLimit: {
              limit: 1,
              period: '15s',
              key: 'event.data.donationAddress',
            },
          },
          { event: 'pledge/check-donation' },
          async ({ event, step }) => {
            await campaignService.handleCheckDonation(
              event.data.donationAddress
            )
          }
        ),
        //pledge/check-spent
        inngest.createFunction(
          {
            id: 'pledge-check',
            rateLimit: {
              limit: 1,
              period: '15s',
              key: 'event.data.pledgeId',
            },
          },
          { event: 'pledge/check-spent' },
          async ({ event, step }) => {
            //Handle pledge spend event as if we subbed to address/outpoint ourself
            await campaignService.handleSpentAnyonecanpayPledge(event.data)
          }
        ),
        //campaign/update
        inngest.createFunction(
          {
            id: 'campaign-update',
            rateLimit: {
              limit: 1,
              period: '15s',
              key: 'event.data.pledgeId',
            },
          },
          { event: 'campaign/update' },
          async ({ event, step }) => {
            await campaignService.handleUpdateCampaign(event.data.campaignId)
          }
        ),
        //campaign/complete
        inngest.createFunction(
          { id: 'fulfill-campaigns' },
          { cron: '0 * * * *' },
          async ({ event, step }) => {
            const completableCampaigns = await step.run('fulfill', async () => {
              return await getCompletableCampaigns()
            })

            const events = completableCampaigns.map((campaign) => ({
              name: 'campaign/complete' as const,
              data: {
                id: campaign.id,
              },
            }))

            if (events.length) {
              await step.sendEvent('complete-campaigns', events)
            }
          }
        ),
        inngest.createFunction(
          {
            id: 'complete-campaign',
            concurrency: {
              limit: 1,
              key: 'event.data.id',
            },
          },
          { event: 'campaign/complete' },
          async ({ event, step }) => {
            //Get the campaign data and run fulfill campaign
            await step.run('handleCampaignComplete', () =>
              campaignService.handleCampaignComplete(event.data.id)
            )
          }
        ),
        //campaign/expired
        inngest.createFunction(
          { id: 'expire-campaigns' },
          { cron: '0 * * * *' },
          async ({ event, step }) => {
            const completableCampaigns = await step.run('fulfill', async () => {
              return await getRefundableCampaigns()
            })

            const events = completableCampaigns.map((campaign) => ({
              name: 'campaign/expired' as const,
              data: {
                id: campaign.id,
              },
            }))

            if (events.length) {
              await step.sendEvent('refund-campaigns', events)
            }
          }
        ),
        inngest.createFunction(
          {
            id: 'refund-campaign',
            concurrency: {
              limit: 1,
              key: 'event.data.id',
            },
          },
          { event: 'campaign/expired' },
          async ({ event, step }) => {
            //Get the campaign data and run fulfill campaign
            await step.run('handleCampaignExpired', () =>
              campaignService.handleCampaignExpired(event.data.id)
            )
          }
        ),
        inngest.createFunction(
          {
            id: 'size-images',
          },
          {
            event: 'image/size' as any,
          },
          async () => {
            await saveMediaAspectRatios()
          }
        ),
        //redis/rebuild
        inngest.createFunction(
          {
            id: 'rebuild-redis',
            concurrency: {
              limit: 1,
            },
            rateLimit: {
              limit: 1,
              period: '1m',
            },
          },
          { event: 'redis/rebuild' },
          async ({ event, step }) => {
            await step.run('set redis building status', () => {
              redisService.setRedisStatus('building')
            })

            const types: NonNullable<Exclude<typeof event.data.types, 'all'>> =
              !event.data.types || event.data.types == 'all'
                ? (['users', 'posts'] as const)
                : event.data.types

            const tasks: Array<Promise<any>> = []

            //Fetch every user
            if (types.includes('users')) {
              tasks.push(
                step.run('fetch users', () => {
                  return mapPaginatedQuery(
                    (cursor) =>
                      getRedisUserProfilePaginated({
                        limit: 25,
                        cursor,
                      }),
                    (users) => {
                      return Promise.all([
                        Promise.all(
                          //All users actions
                          //Per user actions
                          users.map((user) =>
                            Promise.all([
                              cacheUserDetails(user),
                              cacheUserNotifications(user),
                              // cacheUserFollowers(user),
                              // cacheUserHomeTimeline(user),
                              // cacheUserTimeline(user),
                              // cacheUserReposts(user),
                              // cacheUserCampaignPosts(user),
                              // cacheUserLikedPosts(user),
                              // cacheUserReplyPosts(user),
                              // cacheUserMediaPosts(user),
                              // cacheUserTippedPosts(user),
                              // cacheUserMutes(user),
                              // cacheUserBlocking(user),
                              // cacheUserBlockedBy(user),
                            ])
                          )
                        ),
                      ])
                    }
                  )
                })
              )
            }

            if (types.includes('posts')) {
              tasks.push(
                //Fetch all posts (with counts, like count, etc.)
                step.run('fetch posts', () => {
                  return mapPaginatedQuery(
                    (cursor) =>
                      getRedisPostsPaginated({
                        limit: 25,
                        cursor,
                      }),
                    (posts) => {
                      return Promise.all([
                        //All posts actions
                        cachePosts(posts),
                        //Per post actions
                        Promise.all(posts.map((post) => Promise.all([]))),
                      ])
                    }
                  )
                })
              )
            }

            await Promise.all(tasks)

            await step.run('set redis built status', () => {
              redisService.setRedisStatus('built')
            })
          }
        ),
        //active-users
        inngest.createFunction(
          { id: 'update-active-users' },
          { cron: '0/10 * * * *' },
          async ({ event, step }) => {
            const clerkClient = createClerkClient({
              secretKey: process.env.CLERK_SECRET_KEY as string,
            })

            const sessionList = await clerkClient.sessions.getSessionList({
              status: 'active',
            })

            const userIds = new Set<string>()
            sessionList.length &&
              (await db.transaction().execute(async (trx) => {
                for (let i = 0; i <= sessionList.length; i++) {
                  const session = sessionList[i] as (typeof sessionList)[number]
                  if (!session || userIds.has(session.userId)) continue
                  userIds.add(session.userId)
                  const lastActiveAt = moment(session.lastActiveAt).toDate()
                  await trx
                    .updateTable('User')
                    .where('id', '=', session.userId)
                    .set({
                      lastActiveAt: lastActiveAt,
                    })
                    .execute()
                }
              }))
          }
        ),
      ],
    })
  }
}

async function mapPaginatedQuery<T>(
  paginatedQuery: (cursor: Cursor | undefined) => Promise<{
    results: T
    nextCursor: Cursor | undefined
  }>,
  callback: (pageResults: T) => Promise<any | void>
) {
  let page = await paginatedQuery(undefined)
  await callback(page.results)

  while (page.nextCursor) {
    page = await paginatedQuery(page.nextCursor)
    await callback(page.results)
  }
}

type Post = Awaited<
  ReturnType<typeof getRedisPostsPaginated>
>['results'][number]

type User = Awaited<
  ReturnType<typeof getRedisUserProfilePaginated>
>['results'][number]

async function cachePosts(posts: Post[]) {
  //Cache @ {postId}:{publishedByI}+{repostedById:repost | ""}
  return redisService.updatePosts(posts)
}

async function cacheUserDetails(user: User) {
  return redisService.updateUser(user)
}

async function cacheUserNotifications(user: User) {
  const notifications = await getRedisUserNotifications({ id: user.id })
  return redisService.updateUserNotifications(user.id, notifications)
}

async function cacheUserFollowers(user: User) {
  return mapPaginatedQuery(
    (cursor) =>
      getRedisUserFollowersPaginated({
        userId: user.id,
        limit: 100,
        cursor,
      }),
    (followers) => {
      //Cache @ user:followers:{userId}
      return redisService.updateUserFollowers(user.id, followers)
    }
  )
}

async function cacheUserMutes(user: User) {
  return mapPaginatedQuery(
    (cursor) =>
      getRedisUserMutesPaginated({
        userId: user.id,
        limit: 100,
        cursor,
      }),
    (mutes) => {
      //Cache @ user:followers:{userId}
      return redisService.updateUserMutes(
        user.id,
        mutes.map((m) => m.mutedUserId)
      )
    }
  )
}

async function cacheUserBlocking(user: User) {
  return mapPaginatedQuery(
    (cursor) =>
      getRedisUserBlockingPaginated({
        userId: user.id,
        limit: 100,
        cursor,
      }),
    (blocks) => {
      //Cache @ user:followers:{userId}
      return redisService.updateUserBlocking(
        user.id,
        blocks.map((b) => b.blockedUserId)
      )
    }
  )
}

async function cacheUserBlockedBy(user: User) {
  return mapPaginatedQuery(
    (cursor) =>
      getRedisUserBlockedByPaginated({
        userId: user.id,
        limit: 100,
        cursor,
      }),
    (blocks) => {
      //Cache @ user:followers:{userId}
      return redisService.updateUserBlockedBy(
        user.id,
        blocks.map((b) => b.blockingUserId)
      )
    }
  )
}

async function cacheUserHomeTimeline(user: User) {
  return mapPaginatedQuery(
    (cursor) =>
      getRedisUserHomePostsPaginated({
        userId: user.id,
        limit: 100,
        cursor,
      }),
    (posts) => {
      //Cache @ timeline:home:{userId}

      return redisService.updateUserHomeTimeline(user.id, posts)
    }
  )
}

async function cacheUserTimeline(user: User) {
  return mapPaginatedQuery(
    (cursor) =>
      getRedisUserPostsPaginated({
        userId: user.id,
        limit: 100,
        cursor,
      }),
    (posts) => {
      //Cache @ timeline:user:user:{userId}
      return redisService.updateUserTimeline(user.id, posts)
    }
  )
}

async function cacheUserReposts(user: User) {
  return mapPaginatedQuery(
    (cursor) =>
      getRedisUserRepostsPaginated({
        userId: user.id,
        limit: 100,
        cursor,
      }),
    (reposts) => {
      //Cache @ timeline:retweets:user:${userId}

      return redisService.updateUserRepostTimeline(user.id, reposts)
    }
  )
}

async function cacheUserMediaPosts(user: User) {
  return mapPaginatedQuery(
    (cursor) =>
      getRedisUserMediaPostsPaginated({
        userId: user.id,
        limit: 100,
        cursor,
      }),
    (likedPosts) => {
      //Cache @ timeline:likes:user:${userId}
      return redisService.updateUserMediaTimeline(user.id, likedPosts)
    }
  )
}

async function cacheUserLikedPosts(user: User) {
  return mapPaginatedQuery(
    (cursor) =>
      getRedisUserLikedPostsPaginated({
        userId: user.id,
        limit: 100,
        cursor,
      }),
    (likedPosts) => {
      //Cache @ timeline:likes:user:${userId}
      return redisService.updateUserLikeTimeline(user.id, likedPosts)
    }
  )
}

async function cacheUserTippedPosts(user: User) {
  return mapPaginatedQuery(
    (cursor) =>
      getRedisUserTippedPostsPaginated({
        userId: user.id,
        limit: 100,
        cursor,
      }),
    (replyPosts) => {
      //Cache @ timeline:replies:user:${userId} if it has a parentPostId
      return redisService.updateUserTipsTimeline(user.id, replyPosts)
    }
  )
}

async function cacheUserReplyPosts(user: User) {
  return mapPaginatedQuery(
    (cursor) =>
      getRedisUserReplyPostsPaginated({
        userId: user.id,
        limit: 100,
        cursor,
      }),
    (replyPosts) => {
      //Cache @ timeline:replies:user:${userId} if it has a parentPostId
      return redisService.updateUserReplyTimeline(user.id, replyPosts)
    }
  )
}

async function cacheUserCampaignPosts(user: User) {
  return mapPaginatedQuery(
    (cursor) =>
      getRedisUserCampaignPostsPaginated({
        userId: user.id,
        limit: 100,
        cursor,
      }),
    (campaigns) => {
      //Cache @ timeline:replies:user:${userId} if it has a parentPostId
      return redisService.updateUserCampaignTimeline(user.id, campaigns)
    }
  )
}
