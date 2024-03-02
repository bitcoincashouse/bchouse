import { z } from 'zod'
import { publicProcedure, router } from './trpc'
import { PostCardModel } from './types'

export const searchRouter = router({
  explore: publicProcedure
    .input(z.object({ q: z.string().optional() }))
    .query(async (opts) => {
      console.log('Salam')
      const { q } = opts.input
      const { userId } = opts.ctx.auth

      console.log({ userId })
      if (!q) {
        return [] as PostCardModel[]
      }

      // const results = await _.context.searchService.searchPosts(q)
      // const posts = await _.context.redisService.getPosts(
      //   results.hits?.map((result) => ({
      //     id: result.document.id,
      //     publishedById: result.document.post_author_id,
      //   })) || [],
      //   userId
      // )

      // return posts
      return [] as PostCardModel[]
    }),
})

// export type definition of API
export type SearchRouter = typeof searchRouter
