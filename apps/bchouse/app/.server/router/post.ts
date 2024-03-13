import { logger } from '@bchouse/utils'
import { TRPCError } from '@trpc/server'
import { z, ZodError } from 'zod'
import {
  feedService,
  imageService,
  paygateUrl,
  postService,
  profileService,
  userService,
} from '../services/getContext'
import { publicProcedure, router } from '../trpc'
import { postSchema } from '../types/post'

export const postActionSchema = z.object({
  postId: z.string(),
  authorId: z.string(),
  action: z.enum([
    'embed',
    'report',
    'follow:add',
    'follow:remove',
    'list:add',
    'list:remove',
    'mute:add',
    'mute:remove',
    'block:add',
    'block:remove',
    'post:remove',
    //Post actions
    'like:add',
    'like:remove',
    'repost:add',
    'repost:remove',
  ]),
})

const feedInput = z.object({
  id: z.string(),
  type: z.enum([
    'home',
    'user',
    'likes',
    'replies',
    'media',
    'tips',
    'campaigns',
    'all_campaigns',
    'all_posts',
  ]),
  cursor: z.string().nullish(),
})

const uploadInput = z
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

const tipInput = z.object({
  amount: z
    .string()
    .or(z.number())
    .or(z.bigint())
    .transform((amount) => BigInt(amount.toString())),
  postId: z.string(),
})

export const postRouter = router({
  uploadMedia: publicProcedure.input(uploadInput).mutation(async (opts) => {
    // await ratelimit.limitByIp(_, 'api', true)

    const { userId } = opts.ctx.auth

    if (!userId) {
      throw new TRPCError({
        code: 'FORBIDDEN',
      })
    }

    const params = opts.input

    return await imageService.createUploadRequest(userId, params)
  }),
  post: publicProcedure.input(postSchema).mutation(async (opts) => {
    try {
      // await ratelimit.limitByIp(_, 'api', true)

      const { userId } = opts.ctx.auth

      if (!userId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
        })
      }

      const form = opts.input

      const newPostId = await postService.addPost(
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

      return newPostId
    } catch (err) {
      logger.error(err)

      let message = 'Error submitting post. Please try again.'

      if (err instanceof ZodError) {
        const errors = err.flatten().formErrors
        if (errors.length === 1 && errors[0]) message = errors[0]
      }

      return {
        error: {
          message,
        },
      }
    }
  }),
  postAction: publicProcedure.input(postActionSchema).mutation(async (opts) => {
    // await ratelimit.limitByIp(_, 'api', true)

    const { userId, sessionId } = opts.ctx.auth
    const { action, postId, authorId } = opts.input

    if (!userId) {
      return null
    }

    if (action === 'post:remove') {
      await postService.removePost(userId, postId)
    } else if (action === 'repost:add') {
      await postService.addRepost(userId, postId, authorId)
    } else if (action === 'repost:remove') {
      await postService.removeRepost(userId, postId, authorId)
    } else if (action === 'like:add') {
      await postService.addPostLike(userId, postId, authorId)
    } else if (action === 'like:remove') {
      await postService.removePostLike(userId, postId, authorId)
    } else if (action === 'mute:add') {
      await userService.addMute(userId, authorId)
    } else if (action === 'mute:remove') {
      await userService.removeMute(userId, authorId)
    } else if (action === 'block:add') {
      await userService.addBlock(userId, authorId)
    } else if (action === 'block:remove') {
      await userService.removeBlock(userId, authorId)
    } else if (action === 'report') {
      await postService.reportPost(userId, postId)
    } else if (action === 'follow:add') {
      await profileService.addUserFollow(userId, sessionId, authorId)
    } else if (action === 'follow:remove') {
      await profileService.removeUserFollow(userId, sessionId, authorId)
    }

    return {}
  }),
  paymentRequestTip: publicProcedure.input(tipInput).query(async (opts) => {
    // await ratelimit.limitByIp(_, 'api', true)

    const { userId } = await opts.ctx.auth
    const { amount, postId } = opts.input

    const { paymentUrl, invoiceId } = await postService.createTipInvoice({
      postId,
      userId,
      amount,
      paygateUrl: paygateUrl,
    })

    return {
      paymentUrl,
      requestId: invoiceId,
    }
  }),
  getPost: publicProcedure
    .input(z.object({ postId: z.string() }))
    .query(async (opts) => {
      const { userId } = opts.ctx.auth
      const { postId } = opts.input

      const mainPost = await postService.getPost(userId, postId)

      return mainPost
    }),
  status: publicProcedure
    .input(z.object({ statusId: z.string() }))
    .query(async (opts) => {
      const { userId } = opts.ctx.auth
      const { statusId: postId } = opts.input

      const { ancestors, mainPost, children, previousCursor, nextCursor } =
        await postService.getPostWithChildren(userId, postId)

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
  campaign: publicProcedure
    .input(z.object({ statusId: z.string() }))
    .query(async (opts) => {
      const { userId } = opts.ctx.auth
      const { statusId: postId } = opts.input

      const {
        ancestors,
        previousCursor,
        mainPost,
        donorPosts,
        children,
        nextCursor,
      } = await postService.getCampaignPostWithChildren(userId, postId)

      //TODO: Fetch parents dynamically
      return {
        ancestors,
        mainPost,
        children,
        donorPosts,
        nextCursor: nextCursor,
        previousCursor,
      }
    }),
  feed: publicProcedure.input(feedInput).query(async (opts) => {
    try {
      // await ratelimit.limitByIp(_, 'api', true)

      const { userId } = opts.ctx.auth
      const { id, type, cursor } = opts.input

      const result = await feedService.getFeed(
        id,
        userId,
        type,
        cursor ?? undefined
      )

      return result
    } catch (err) {
      logger.error('Error getting paginated results:', err)
      throw err
    }
  }),
})
