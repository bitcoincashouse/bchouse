import { logger } from '@bchouse/utils'
import { TRPCRouterRecord } from '@trpc/server'
import { z } from 'zod'
import { appEnv } from '~/.server/appEnv'
import { postService } from '../services/getContext'
import { publicProcedure } from '../trpc'

export const moderationRouter = {
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

        if (appEnv.API_SECRET && secret == appEnv.API_SECRET) {
          await postService.postModerationAction(action, postId)
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
} satisfies TRPCRouterRecord
