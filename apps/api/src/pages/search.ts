import { z } from 'zod'
import { publicProcedure, router } from '../trpc'
import { PostCardModel } from '../types'

export const searchRouter = router({
  explore: publicProcedure
    .input(z.object({ q: z.string().optional() }))
    .query(async (opts) => {
      console.log('Salam explore', opts.ctx.auth.userId)
      const { q } = opts.input
      const { userId } = opts.ctx.auth

      if (!q) {
        return [] as PostCardModel[]
      }

      const results = await opts.ctx.searchService.searchPosts(q)
      const posts = await opts.ctx.redisService.getPosts(
        results.hits?.map((result) => ({
          id: result.document.id,
          publishedById: result.document.post_author_id,
        })) || [],
        userId
      )

      return posts
    }),
})
