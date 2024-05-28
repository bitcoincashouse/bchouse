import { logger } from '@bchouse/utils'
import { ActionFunctionArgs } from '@remix-run/node'
import { z } from 'zod'
import { pledgeService } from '~/.server/getContext'
import { zx } from '~/utils/zodix'

const formSchema = z.object({
  name: z.string().optional(),
  comment: z.string().optional(),
  secret: z.string(),
})

export type FormSchema = z.infer<typeof formSchema>
export const action = async (_: ActionFunctionArgs) => {
  // await opts.ctx.ratelimit.limitByIp(_, 'api', true)
  try {
    const { name, comment, secret } = await zx.parseForm(_.request, formSchema)

    if (!name && !comment) {
      return false
    }

    const success = await pledgeService.addComment({
      name,
      comment,
      secret,
    })
    return success
  } catch (err) {
    logger.error(err)
    throw err
  }
}
