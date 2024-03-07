import { logger } from '@bchouse/utils'
import { TRPCError } from '@trpc/server'
import { z } from 'zod'
import { publicProcedure, router } from '../trpc'
import { postSchema } from './post'

export const pagesRouter = router({
  status: publicProcedure
    .input(
      z.object({
        username: z.string(),
        statusId: z.string(),
      })
    )
    .query(async (opts) => {
      const { userId } = opts.ctx.auth
      const { username, statusId: postId } = opts.input

      const { ancestors, mainPost, children, previousCursor, nextCursor } =
        await opts.ctx.postService.getPostWithChildren(userId, postId)

      //TODO: Fetch parents dynamically
      return {
        posts: [
          ...ancestors.map((a) => ({ ...a, isThread: true })),
          mainPost,
          ...children,
        ],
        nextCursor: nextCursor,
        previousCursor,
      }
    }),
  commentOnCampaign: publicProcedure.query(async (opts) => {
    try {
      await _.context.ratelimit.limitByIp(_, 'api', true)

      const { name, comment, secret } = z
        .object({
          name: z.string().optional(),
          comment: z.string().optional(),
          secret: z.string(),
        })
        .parse(await _.request.json())

      if (!name && !comment) {
        return json(false)
      }

      const success = await _.context.pledgeService.addComment({
        name,
        comment,
        secret,
      })
      return json(success)
    } catch (err) {
      logger.error(err)
      throw err
    }
  }),
  clusters: publicProcedure.query(async (opts) => {
    try {
      if (await _.context.authService.getIsAdmin(_)) {
        const electrumCluster =
          _.context.electrumService.getElectrumCluster('chipnet')

        const stats = {
          clients: Object.keys(electrumCluster.clients),
          connections: electrumCluster.connections,
          status: electrumCluster.status,
        }
        logger.info(stats)
        return typedjson(stats)
      } else {
        return typedjson(null)
      }
    } catch (err) {
      logger.error(err)
      return typedjson(null)
    }
  }),
  contributions: publicProcedure.query(async (opts) => {
    await _.context.ratelimit.limitByIp(_, 'api', true)

    const { campaignId } = zx.parseParams(_.params, {
      campaignId: z.string(),
    })

    const result = await _.context.campaignService.getUiContributions(
      campaignId
    )
    return typedjson(result)
  }),
  contributionsList: publicProcedure.query(async (opts) => {
    await _.context.ratelimit.limitByIp(_, 'api', true)

    const { campaignId } = zx.parseParams(_.params, {
      campaignId: z.string(),
    })

    const result = await _.context.campaignService.getAllContributions(
      campaignId
    )
    return typedjson(result)
  }),
  feed: publicProcedure.query(async (opts) => {
    try {
      return []

      await _.context.ratelimit.limitByIp(_, 'api', true)

      const { userId } = await _.context.authService.getAuthOptional(_)

      const { id, type, cursor } = zx.parseParams(_.params, {
        id: z.string(),
        type: z.enum([
          'home',
          'user',
          'likes',
          'replies',
          'media',
          'campaigns',
          'all_campaigns',
          'all_posts',
        ]),
        cursor: z.string().optional(),
      })

      const result = await _.context.feedService.getFeed(
        id,
        userId,
        type,
        cursor
      )

      return typedjson(result)
    } catch (err) {
      logger.error('Error getting paginated results:', err)
      throw err
    }
  }),
  profile: publicProcedure.query(async (opts) => {
    //Applies to entire application
    // await opts.ctx.ratelimit.limitByIp(_, 'app', true)
    console.log('Salam profile')
    const { userId } = opts.ctx.auth

    const profile =
      !!userId && (await opts.ctx.profileService.getHomeProfile(userId))

    //TODO: Persist dismissed update profile (add to home profile return)
    const showUpdateProfile = profile && !profile.homeView.bchAddress && false

    if (!profile) {
      return {
        anonymousView: true,
      } as const
    } else {
      return {
        ...profile,
        anonymousView: false,
        showUpdateProfile,
      } as const
    }
  }),
  lastActive: publicProcedure.mutation(async (opts) => {
    try {
      const { userId } = opts.ctx.auth

      if (userId) {
        logger.info('Updating last active', userId)
        await opts.ctx.userService.updateAccountActivity(userId)
      }

      return null
    } catch (err) {
      logger.error(err)
      throw err
    }
  }),
  stats: publicProcedure.query(async (opts) => {
    // await opts.ctx.ratelimit.limitByIp(_, 'api', true)

    const { userCount, dailyActiveUserCount, weeklyActiveUserCount } =
      await opts.ctx.userService.getUserCounts()

    return { userCount, dailyActiveUserCount, weeklyActiveUserCount }
  }),
  activeCampaigns: publicProcedure
    .input(z.object({ username: z.string().optional() }))
    .query(async (opts) => {
      // await opts.ctx.ratelimit.limitByIp(_, 'api', true)

      const username = opts.input.username

      const activeCampaigns = await opts.ctx.campaignService.getActiveCampaigns(
        {
          limit: 2,
          username,
        }
      )

      return activeCampaigns.map((c) => ({
        id: c.id,
        title: c.title,
        expires: c.expires,
        goal: Number(c.goal || 0),
        raised: Number(c.raised || 0),
        pledges: Number(c.pledges || 0),
        username: c.username,
        statusId: c.statusId,
      }))
    }),
  paymentRequestPledge: publicProcedure
    .input(
      z.object({
        amount: z
          .string()
          .or(z.number())
          .or(z.bigint())
          .transform((amount) => BigInt(amount.toString())),
        address: z.string(),
        campaignId: z.string(),
      })
    )
    .query(async (opts) => {
      // await opts.ctx.ratelimit.limitByIp(_, 'api', true)

      const { userId } = await opts.ctx.auth

      const {
        amount: satoshis,
        address: returnAddress,
        campaignId,
      } = opts.input

      const { paymentUrl, invoiceId, network, secret } =
        await opts.ctx.pledgeService.createInvoice({
          campaignId,
          userId,
          paygateUrl: opts.ctx.paygateUrl,
          amount: satoshis,
          refundAddress: returnAddress,
          bchouseUrl: opts.ctx.bchouseUrl,
        })

      let headers = {} as Record<string, string>

      //TODO: Add some way for non-logged in users to view
      // Besides using WalletConnect
      // if (!userId) {
      //   const pledgeSession = await getPledgeSession(_.request)
      //   pledgeSession.addPledgeSecret(secret)
      //   headers['Set-Cookie'] = await pledgeSession.commit()
      // }

      return {
        paymentUrl,
        requestId: invoiceId,
        secret,
      }
    }),
  paymentRequestTip: publicProcedure
    .input(
      z.object({
        amount: z
          .string()
          .or(z.number())
          .or(z.bigint())
          .transform((amount) => BigInt(amount.toString())),
        postId: z.string(),
      })
    )
    .query(async (opts) => {
      // await opts.ctx.ratelimit.limitByIp(_, 'api', true)

      const { userId } = await opts.ctx.auth
      const { amount, postId } = opts.input

      const { paymentUrl, invoiceId } =
        await opts.ctx.postService.createTipInvoice({
          postId,
          userId,
          amount,
          paygateUrl: opts.ctx.paygateUrl,
        })

      return {
        paymentUrl,
        requestId: invoiceId,
      }
    }),
  updateFollow: publicProcedure
    .input(
      z.object({
        action: z.enum(['follow', 'unfollow']),
        profileId: z.string().nonempty(),
      })
    )
    .mutation(async (opts) => {
      try {
        // await opts.ctx.ratelimit.limitByIp(_, 'api', true)

        if (!opts.ctx.auth?.userId) {
          throw new TRPCError({
            code: 'FORBIDDEN',
          })
        }

        const { userId, sessionId } = opts.ctx.auth
        const { action, profileId } = opts.input

        if (action === 'follow') {
          await opts.ctx.profileService.addUserFollow(
            userId,
            sessionId,
            profileId
          )
        } else {
          await opts.ctx.profileService.removeUserFollow(
            userId,
            sessionId,
            profileId
          )
        }

        return profileId
      } catch (err) {
        return { error: err }
      }
    }),
  isFollowing: publicProcedure
    .input(
      z.object({
        profileId: z.string().nonempty(),
      })
    )
    .query(async (opts) => {
      if (!opts.ctx.auth?.userId) {
        return false
      }

      const { userId } = opts.ctx.auth

      return await opts.ctx.profileService.getIsFollowing(
        userId,
        opts.input.profileId
      )
    }),
  uploadMedia: publicProcedure.mutation(async (opts) => {
    await _.context.ratelimit.limitByIp(_, 'api', true)

    const { userId } = await _.context.authService.getAuth(_)
    const params = zx.parseParams(
      _.params,
      z
        .object({
          type: z.literal('coverPhoto'),
        })
        .strip()
        .or(
          z.object({
            type: z.literal('post'),
            count: z.coerce.number().min(1).max(8),
          })
        )
    )

    return typedjson(
      await _.context.imageService.createUploadRequest(userId, params)
    )
  }),
  refundPledge: publicProcedure.mutation(async (opts) => {
    try {
      await _.context.ratelimit.limitByIp(_, 'api', true)

      const { secret } = await zx.parseForm(_.request, {
        secret: z.string(),
      })

      const result = await _.context.pledgeService.cancelPledge({ secret })
      return typedjson(result)
    } catch (err) {
      logger.error(err)
      return typedjson({ error: true, txid: null })
    }
  }),
  post: publicProcedure.mutation(async (opts) => {
    try {
      await _.context.ratelimit.limitByIp(_, 'api', true)

      const { userId } = await _.context.authService.getAuth(_)
      const formData = await _.request.json()

      const form = postSchema.parse(formData)

      const newPostId = await _.context.postService.addPost(
        userId,
        'parentPost' in form
          ? {
              content: form.comment,
              audienceType: 'CHILD' as const,
              mediaIds: form.mediaIds,
              parentPost: {
                id: form.parentPost.id,
                publishedById: form.parentPost.publishedById,
              },
            }
          : {
              content: form.comment,
              audienceType: form.audienceType,
              mediaIds: form.mediaIds,
              monetization: form.monetization,
            }
      )

      return typedjson(newPostId)
    } catch (err) {
      logger.error(err)

      let message = 'Error submitting post. Please try again.'

      if (err instanceof ZodError) {
        const errors = err.flatten().formErrors
        if (errors.length === 1 && errors[0]) message = errors[0]
      }

      return typedjson({
        error: {
          message,
        },
      })
    }
  }),
  updateProfile: publicProcedure.mutation(async (opts) => {
    await _.context.ratelimit.limitByIp(_, 'api', true)

    const { userId: currentUserId } =
      await _.context.authService.getAuthOptional(_)
    const { userId } = zx.parseParams(_.params, {
      userId: z.string(),
    })

    const user = await _.context.profileService.getBasicProfileById(
      currentUserId,
      userId
    )

    return typedjson(user)
  }),
  getProfile: publicProcedure.query(async (opts) => {
    try {
      const { userId } = await _.context.authService.getAuth(_)
      const body = await zx.parseForm(
        _.request,
        z
          .object({
            about: z.string().optional(),
            bchAddress: z.string().optional(),
            company: z.string().optional(),
            coverPhotoMediaId: z.string().optional(),
            location: z.string().optional(),
            title: z.string().optional(),
            website: z.string().optional(),
          })
          .strip()
      )

      const user = await _.context.profileService.updateProfile(userId, body)
      return typedjson(user)
    } catch (err) {
      return typedjson({ error: err })
    }
  }),
  search: publicProcedure.query(async (opts) => {
    await _.context.ratelimit.limitByIp(_, 'api', true, 'search')

    const { q = '' } = zx.parseQuery(_.request, {
      q: z.string().optional(),
    })

    return json(await _.context.searchService.searchPosts(q), {
      headers: {
        'Content-Type': 'application/json',
      },
    })
  }),
  setTheme: publicProcedure.mutation(async (opts) => {
    const themeSession = await getThemeSession(request)
    const requestText = await request.text()
    const form = new URLSearchParams(requestText)
    const theme = form.get('theme')

    if (!isTheme(theme)) {
      return json({
        success: false,
        message: `theme value of ${theme} is not a valid theme`,
      })
    }

    themeSession.setTheme(theme)
    return json(
      { success: true },
      { headers: { 'Set-Cookie': await themeSession.commit() } }
    )
  }),
  clerkRegistrationWebhook: publicProcedure.mutation(async (opts) => {
    // Verify the webhook signature
    // See https://docs.svix.com/receiving/verifying-payloads/how
    const payload = Buffer.from(await _.request.arrayBuffer()).toString()
    const headers = Object.fromEntries(_.request.headers.entries())
    const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET as string)

    let evt

    try {
      evt = wh.verify(payload, headers) as WebhookEvent
    } catch (_) {
      logger.warn('Unauthorized access attempt to registration webhook')
      throw new Response('POST action not found', {
        status: HttpStatus.NOT_FOUND,
      })
    }

    if (evt.type === 'user.created') {
      await _.context.userService.createAccountWebhook(evt.data)
    } else if (evt.type === 'user.updated') {
      await _.context.userService.updateAccountWebhook(evt.data)
    } else if (evt.type === 'user.deleted') {
      await _.context.userService.deleteAccountWebhook(evt.data)
    }

    return json({})
  }),
  postAction: publicProcedure.mutation(async (opts) => {
    await _.context.ratelimit.limitByIp(_, 'api', true)

    const { userId, sessionId } = await _.context.authService.getAuthOptional(_)
    const { action, postId, authorId } = zx.parseParams(
      _.params,
      postActionSchema
    )

    if (!userId) {
      return null
    }

    if (action === 'post:remove') {
      await _.context.postService.removePost(userId, postId)
    } else if (action === 'repost:add') {
      await _.context.postService.addRepost(userId, postId, authorId)
    } else if (action === 'repost:remove') {
      await _.context.postService.removeRepost(userId, postId, authorId)
    } else if (action === 'like:add') {
      await _.context.postService.addPostLike(userId, postId, authorId)
    } else if (action === 'like:remove') {
      await _.context.postService.removePostLike(userId, postId, authorId)
    } else if (action === 'mute:add') {
      await _.context.userService.addMute(userId, authorId)
    } else if (action === 'mute:remove') {
      await _.context.userService.removeMute(userId, authorId)
    } else if (action === 'block:add') {
      await _.context.userService.addBlock(userId, authorId)
    } else if (action === 'block:remove') {
      await _.context.userService.removeBlock(userId, authorId)
    } else if (action === 'report') {
      await _.context.postService.reportPost(userId, postId)
    } else if (action === 'follow:add') {
      await _.context.profileService.addUserFollow(userId, sessionId, authorId)
    } else if (action === 'follow:remove') {
      await _.context.profileService.removeUserFollow(
        userId,
        sessionId,
        authorId
      )
    }

    return typedjson({})
  }),
  clerkLoginWebhook: publicProcedure.mutation(async (opts) => {
    // Verify the webhook signature
    // See https://docs.svix.com/receiving/verifying-payloads/how
    const payload = Buffer.from(await _.request.arrayBuffer()).toString()
    const headers = Object.fromEntries(_.request.headers.entries())
    const wh = new Webhook(process.env.CLERK_SIGNIN_WEBHOOK_SECRET as string)

    let evt

    try {
      evt = wh.verify(payload, headers) as WebhookEvent
    } catch (_) {
      logger.warn('Unauthorized access attempt to registration webhook')
      throw new Response('POST action not found', {
        status: HttpStatus.NOT_FOUND,
      })
    }

    if (evt.type === 'user.created' || evt.type === 'user.updated') {
      await _.context.userService.updateAccountActivity(evt.data.id)
    } else if (evt.type === 'session.created') {
      await _.context.userService.updateAccountActivity(evt.data.user_id)
    }

    return json({})
  }),
  validateAnyonecanpay: publicProcedure.mutation(async (opts) => {
    try {
      await _.context.ratelimit.limitByIp(_, 'api', true)

      const { campaignId } = zx.parseParams(_.params, {
        campaignId: z.string(),
      })

      const { payload } = z
        .object({
          payload: z.string(),
        })
        .parse(await _.request.json())

      const isValid =
        await _.context.campaignService.validateAnyonecanpayPledge(
          campaignId,
          payload
        )

      return typedjson({ isValid })
    } catch (err) {
      logger.error(err)
      return typedjson({ isValid: false })
    }
  }),
  submitAnyonecanpay: publicProcedure.mutation(async (opts) => {
    await _.context.ratelimit.limitByIp(_, 'api', true)

    const { userId } = await _.context.authService.getAuthOptional(_)

    const { campaignId } = zx.parseParams(_.params, {
      campaignId: z.string(),
    })

    const { payload } = z
      .object({
        payload: z.string(),
      })
      .parse(await _.request.json())

    const result = await _.context.campaignService.submitAnyonecanpayPledge(
      campaignId,
      payload,
      userId
    )

    return typedjson(result)
  }),
  handleReportedPost: publicProcedure.mutation(async (opts) => {
    try {
      const { action, secret, postId } = await zx.parseForm(_.request, {
        action: z.enum(['ALLOW', 'REMOVE']),
        secret: z.string().nonempty(),
        postId: z.string(),
      })

      if (process.env.API_SECRET && secret == process.env.API_SECRET) {
        await _.context.postService.postModerationAction(action, postId)
      }

      return json(true)
    } catch (err) {
      logger.error(err)

      return json({
        error:
          err && typeof err === 'object' && 'message' in err
            ? err.message
            : typeof err === 'string'
            ? err
            : 'Unknown error occurred',
      })
    }
  }),
  post: publicProcedure.mutation(async (opts) => {}),
  post: publicProcedure.query(async (opts) => {}),
})
