import { logger } from '@bchouse/utils'
import { z } from 'zod'
import { publicProcedure, router } from '../trpc'

export const moderationRouter = router({
  handleReportedPost: publicProcedure
    .input(
      z.object({
        action: z.enum(['ALLOW', 'REMOVE']),
        secret: z.string().nonempty(),
        postId: z.string(),
      })
    )
    .mutation(async (opts) => {
      try {
        const { action, secret, postId } = opts.input

        if (process.env.API_SECRET && secret == process.env.API_SECRET) {
          await opts.ctx.postService.postModerationAction(action, postId)
        }

        return true
      } catch (err) {
        logger.error(err)

        return {
          error:
            err && typeof err === 'object' && 'message' in err
              ? err.message
              : typeof err === 'string'
              ? err
              : 'Unknown error occurred',
        }
      }
    }),
})
