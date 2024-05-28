import { logger } from '@bchouse/utils'
import { LoaderFunctionArgs } from '@remix-run/node'
import { z } from 'zod'
import { feedService } from '~/.server/getContext'
import { getAuthOptional } from '~/utils/auth'
import { zx } from '~/utils/zodix'

const paramSchema = z.object({
  id: z.string(),
  type: z.enum([
    'home',
    'user',
    'likes',
    'replies',
    'media',
    'tips',
    'campaigns',
    'all_campaigns',
    'all_posts',
  ]),
  cursor: z.string().nullish(),
})

export const loader = async (_: LoaderFunctionArgs) => {
  try {
    // await ratelimit.limitByIp(_, 'api', true)

    const { userId } = await getAuthOptional(_)
    const { id, type, cursor } = zx.parseParams(_.params, paramSchema)

    const result = await feedService.getFeed(
      id,
      userId,
      type,
      cursor ?? undefined
    )

    return result
  } catch (err) {
    logger.error('Error getting paginated results:', err)
    throw err
  }
}
