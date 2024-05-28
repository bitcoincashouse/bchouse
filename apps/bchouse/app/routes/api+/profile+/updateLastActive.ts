import { logger } from '@bchouse/utils'
import { ActionFunctionArgs } from '@remix-run/node'
import { userService } from '~/.server/getContext'
import { getAuthOptional } from '~/utils/auth'

export const action = async (_: ActionFunctionArgs) => {
  // await opts.ctx.ratelimit.limitByIp(_, 'api', true)
  try {
    const { userId } = await getAuthOptional(_)

    if (userId) {
      logger.info('Updating last active', userId)
      await userService.updateAccountActivity(userId)
    }

    return null
  } catch (err) {
    logger.error(err)
    throw err
  }
}
