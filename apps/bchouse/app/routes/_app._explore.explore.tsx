import { LoaderArgs } from '@remix-run/node'
import { typedjson, useTypedLoaderData } from 'remix-typedjson'
import { z } from 'zod'
import { StandardPostCard } from '~/components/post/standard-post-card'
import { PostCardModel } from '~/components/post/types'
import { zx } from '~/utils/zodix'
import { useLayoutLoaderData } from './_app/route'

export const loader = async (_: LoaderArgs) => {
  const { userId } = await _.context.authService.getAuthOptional(_)

  const { q } = zx.parseQuery(_.request, {
    q: z.string().optional(),
  })

  if (!q) {
    return typedjson([] as PostCardModel[])
  }

  const results = await _.context.searchService.searchPosts(q)
  const posts = await _.context.redisService.getPosts(
    results.hits?.map((result) => ({
      id: result.document.id,
      publishedById: result.document.post_author_id,
    })) || [],
    userId
  )

  return typedjson(posts)
}

export default function Index() {
  const posts = useTypedLoaderData<typeof loader>()
  const layoutData = useLayoutLoaderData()

  return (
    <>
      {posts.length ? (
        posts.map((post) => (
          <StandardPostCard
            key={post.key}
            post={post}
            currentUser={
              layoutData.anonymousView ? undefined : layoutData.profile
            }
          />
        ))
      ) : (
        <div className="flex flex-col items-center justify-center p-4 pt-8 gap-2">
          <h2 className="text-xl font-semibold text-secondary-text">
            No search results
          </h2>
          {
            <p className="text-gray-400">
              When there's search results, you’ll see it here.
            </p>
          }
        </div>
      )}
    </>
  )
}
