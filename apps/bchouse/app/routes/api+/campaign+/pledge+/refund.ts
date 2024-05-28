import { logger } from '@bchouse/utils'
import { ActionFunctionArgs } from '@remix-run/node'
import { z } from 'zod'
import { pledgeService } from '~/.server/getContext'
import { zx } from '~/utils/zodix'

const formSchema = z.object({ secret: z.string() })
export type FormSchema = z.infer<typeof formSchema>

export const action = async (_: ActionFunctionArgs) => {
  try {
    // await opts.ctx.ratelimit.limitByIp(_, 'api', true)

    const { secret } = await zx.parseForm(_.request, formSchema)
    const result = await pledgeService.cancelPledge({ secret })

    return result
  } catch (err) {
    logger.error(err)
    return { error: true, txid: null }
  }
}
