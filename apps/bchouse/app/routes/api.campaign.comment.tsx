import { logger } from '@bchouse/utils'
import { ActionFunctionArgs, json } from '@remix-run/node'
import { z } from 'zod'

export const action = async (_: ActionFunctionArgs) => {
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
}
