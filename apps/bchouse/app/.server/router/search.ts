import { z } from 'zod'
import { redisService, searchService } from '../services/getContext'
import { PostCardModel } from '../services/services/types'
import { publicProcedure, router } from '../trpc'

export const searchRouter = router({
  explore: publicProcedure
    .input(z.object({ q: z.string().optional() }))
    .query(async (opts) => {
      const { q } = opts.input
      const { userId } = opts.ctx.auth

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
    }),
  search: publicProcedure
    .input(z.object({ q: z.string().optional() }))
    .query(async (opts) => {
      // await ratelimit.limitByIp(_, 'api', true, 'search')

      const { q = '' } = opts.input
      return await searchService.searchPosts(q)
    }),
  searchHashtag: publicProcedure
    .input(z.object({ hashtag: z.string() }))
    .query(async (opts) => {
      const { userId } = opts.ctx.auth
      const { hashtag } = opts.input

      const results = await searchService.searchPosts(hashtag)
      const posts = await redisService.getPosts(
        results.hits?.map((result) => ({
          id: result.document.id,
          publishedById: result.document.post_author_id,
        })) || [],
        userId
      )

      return posts
    }),
})
