import { logger } from '@bchouse/utils'
import { TRPCError } from '@trpc/server'
import { z, ZodError } from 'zod'
import { publicProcedure, router } from '../trpc'
import { postSchema } from '../types/post'
import { postActionSchema } from '../types/postAction'

const statusInput = z.object({
  username: z.string(),
  statusId: z.string(),
})

const feedInput = z.object({
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
    // await opts.ctx.ratelimit.limitByIp(_, 'api', true)

    const { userId } = opts.ctx.auth

    if (!userId) {
      throw new TRPCError({
        code: 'FORBIDDEN',
      })
    }

    const params = opts.input

    return await opts.ctx.imageService.createUploadRequest(userId, params)
  }),
  post: publicProcedure.input(postSchema).mutation(async (opts) => {
    try {
      // await opts.ctx.ratelimit.limitByIp(_, 'api', true)

      const { userId } = opts.ctx.auth

      if (!userId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
        })
      }

      const form = opts.input

      const newPostId = await opts.ctx.postService.addPost(
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
    // await opts.ctx.ratelimit.limitByIp(_, 'api', true)

    const { userId, sessionId } = opts.ctx.auth
    const { action, postId, authorId } = opts.input

    if (!userId) {
      return null
    }

    if (action === 'post:remove') {
      await opts.ctx.postService.removePost(userId, postId)
    } else if (action === 'repost:add') {
      await opts.ctx.postService.addRepost(userId, postId, authorId)
    } else if (action === 'repost:remove') {
      await opts.ctx.postService.removeRepost(userId, postId, authorId)
    } else if (action === 'like:add') {
      await opts.ctx.postService.addPostLike(userId, postId, authorId)
    } else if (action === 'like:remove') {
      await opts.ctx.postService.removePostLike(userId, postId, authorId)
    } else if (action === 'mute:add') {
      await opts.ctx.userService.addMute(userId, authorId)
    } else if (action === 'mute:remove') {
      await opts.ctx.userService.removeMute(userId, authorId)
    } else if (action === 'block:add') {
      await opts.ctx.userService.addBlock(userId, authorId)
    } else if (action === 'block:remove') {
      await opts.ctx.userService.removeBlock(userId, authorId)
    } else if (action === 'report') {
      await opts.ctx.postService.reportPost(userId, postId)
    } else if (action === 'follow:add') {
      await opts.ctx.profileService.addUserFollow(userId, sessionId, authorId)
    } else if (action === 'follow:remove') {
      await opts.ctx.profileService.removeUserFollow(
        userId,
        sessionId,
        authorId
      )
    }

    return {}
  }),
  paymentRequestTip: publicProcedure.input(tipInput).query(async (opts) => {
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
  status: publicProcedure.input(statusInput).query(async (opts) => {
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
  feed: publicProcedure.input(feedInput).query(async (opts) => {
    try {
      // await opts.ctx.ratelimit.limitByIp(_, 'api', true)

      const { userId } = opts.ctx.auth
      const { id, type, cursor } = opts.input

      const result = await opts.ctx.feedService.getFeed(
        id,
        userId,
        type,
        cursor
      )

      return result
    } catch (err) {
      logger.error('Error getting paginated results:', err)
      throw err
    }
  }),
})
