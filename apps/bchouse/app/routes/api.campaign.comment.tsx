import { ActionArgs, json } from '@remix-run/node'
import { z } from 'zod'
import { logger } from '~/utils/logger'

export const action = async (_: ActionArgs) => {
  try {
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
}
