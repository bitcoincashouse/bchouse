import { LoaderFunctionArgs } from '@remix-run/node'
import { ClientLoaderFunctionArgs, useSearchParams } from '@remix-run/react'
import { $preload, $useLoaderQuery } from 'remix-query'
import { z } from 'zod'
import { StandardPostCard } from '~/components/post/card/implementations/standard-post-card'
import { zx } from '~/utils/zodix'

export const loader = async (_: LoaderFunctionArgs) => {
  const { q } = zx.parseQuery(_.request, {
    q: z.string().optional(),
  })

  return $preload(_, '/api/search/explore/:q?', { q })
}

export const clientLoader = async (_: ClientLoaderFunctionArgs) => {
  const { q } = zx.parseQuery(_.request, {
    q: z.string().optional(),
  })

  // await $preloadClient('/api/search/explore/:q?', { q });

  return null
}

export default function Index() {
  const [searchParams] = useSearchParams()
  const { data: posts, isLoading } = $useLoaderQuery(
    '/api/search/explore/:q?',
    {
      params: {
        q: searchParams.get('q') || undefined,
      },
      staleTime: 5 * 60 * 1000,
    }
  )

  return (
    <>
      {!isLoading && posts?.length ? (
        posts.map((post) => <StandardPostCard key={post.key} post={post} />)
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
