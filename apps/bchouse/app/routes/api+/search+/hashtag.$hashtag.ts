import { LoaderFunctionArgs } from '@remix-run/node'
import { z } from 'zod'
import { redisService, searchService } from '~/.server/getContext'
import { getAuthOptional } from '~/utils/auth'
import { zx } from '~/utils/zodix'

const paramSchema = z.object({ hashtag: z.string() })

export const loader = async (_: LoaderFunctionArgs) => {
  // await ratelimit.limitByIp(_, 'api', true, 'search')

  const { hashtag } = zx.parseParams(_.params, paramSchema)
  const { userId } = await getAuthOptional(_)

  const results = await searchService.searchPosts(hashtag)
  const posts = await redisService.getPosts(
    results.hits?.map((result) => ({
      id: result.document.id,
      publishedById: result.document.post_author_id,
    })) || [],
    userId
  )

  return posts
}
