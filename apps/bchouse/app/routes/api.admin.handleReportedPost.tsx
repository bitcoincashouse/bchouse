import { ActionArgs, json } from '@remix-run/node'
import { z } from 'zod'
import { logger } from '~/utils/logger'
import { zx } from '~/utils/zodix'

export const action = async (_: ActionArgs) => {
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
}
