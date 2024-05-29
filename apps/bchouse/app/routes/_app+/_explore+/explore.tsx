import { LoaderFunctionArgs } from '@remix-run/node'
import { ClientLoaderFunctionArgs, useSearchParams } from '@remix-run/react'
import { $preload } from 'remix-query'
import { z } from 'zod'
import { StandardPostCard } from '~/components/post/card/implementations/standard-post-card'
import { zx } from '~/utils/zodix'
import { useSearchQuery } from './_layout/hooks/useSearchQuery'

export const loader = async (_: LoaderFunctionArgs) => {
  const { q } = zx.parseQuery(_.request, {
    q: z.string().optional(),
  })

  return $preload(_, '/api/search/explore/:q?', { q })
}

export const clientLoader = async (_: ClientLoaderFunctionArgs) => {
  return null
}

export default function Index() {
  const [searchParams] = useSearchParams()
  const searchQuery = searchParams.get('q') || undefined
  const { data: posts, isLoading } = useSearchQuery(searchQuery)

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
