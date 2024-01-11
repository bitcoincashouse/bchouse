import { LoaderArgs } from '@remix-run/node'
import { UseDataFunctionReturn, typedjson } from 'remix-typedjson'
import { z } from 'zod'
import { logger } from '~/utils/logger'
import { zx } from '~/utils/zodix'

export const loader = async (_: LoaderArgs) => {
  try {
    const { userId } = await _.context.authService.getAuthOptional(_)

    const { id, type, cursor } = zx.parseParams(_.params, {
      id: z.string(),
      type: z.enum([
        'home',
        'user',
        'likes',
        'replies',
        'media',
        'campaigns',
        'all_campaigns',
        'all_posts',
      ]),
      cursor: z.string().optional(),
    })

    const result = await _.context.feedService.getFeed(id, userId, type, cursor)

    return typedjson(result)
  } catch (err) {
    logger.error('Error getting paginated results:', err)
    throw err
  }
}

export type FeedResponse = UseDataFunctionReturn<typeof loader>
