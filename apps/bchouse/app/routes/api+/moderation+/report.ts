import { logger } from '@bchouse/utils'
import { ActionFunctionArgs } from '@remix-run/node'
import { z } from 'zod'
import { appEnv } from '~/.server/appEnv'
import { postService } from '~/.server/getContext'
import { zx } from '~/utils/zodix'

export const action = async (_: ActionFunctionArgs) => {
  try {
    const { action, secret, postId } = await zx.parseForm(_.request, {
      action: z.enum(['ALLOW', 'REMOVE']),
      secret: z.string().nonempty(),
      postId: z.string(),
    })

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
}
