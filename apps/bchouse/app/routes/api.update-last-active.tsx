import type { ActionArgs } from '@remix-run/node'
import { z } from 'zod'
import { logger } from '~/utils/logger'

export const action = async (_: ActionArgs) => {
  try {
    const { id } = z
      .object({
        id: z.string(),
      })
      .parse(await _.request.json())

    await _.context.userService.updateAccountActivity(id)

    return null
  } catch (err) {
    logger.error(err)
    throw err
  }
}
