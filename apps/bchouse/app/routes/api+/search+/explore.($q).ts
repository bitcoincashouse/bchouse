import { LoaderFunctionArgs } from '@remix-run/node'
import { z } from 'zod'
import { redisService, searchService } from '~/.server/getContext'
import { PostCardModel } from '~/.server/services/types'
import { getAuthOptional } from '~/utils/auth'
import { zx } from '~/utils/zodix'

const paramSchema = z.object({ q: z.string().optional() })

export const loader = async (_: LoaderFunctionArgs) => {
  const { userId } = await getAuthOptional(_)
  const { q } = zx.parseParams(_.params, paramSchema)

  if (!q) {
    return [] as PostCardModel[]
  }

  const results = await searchService.searchPosts(q)
  const posts = await redisService.getPosts(
    results.hits?.map((result) => ({
      id: result.document.id,
      publishedById: result.document.post_author_id,
    })) || [],
    userId
  )

  return posts
}
