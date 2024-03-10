import { LoaderFunctionArgs } from '@remix-run/node'
import { ClientLoaderFunctionArgs, useSearchParams } from '@remix-run/react'
import { z } from 'zod'
import { StandardPostCard } from '~/components/post/card/implementations/standard-post-card'
import { trpc } from '~/utils/trpc'
import { zx } from '~/utils/zodix'

export const loader = async (_: LoaderFunctionArgs) => {
  const { q } = zx.parseQuery(_.request, {
    q: z.string().optional(),
  })

  await _.context.trpc.search.explore.prefetch({ q })

  return _.context.getDehydratedState()
}

export const clientLoader = async (_: ClientLoaderFunctionArgs) => {
  const { q } = zx.parseQuery(_.request, {
    q: z.string().optional(),
  })

  await window.trpcClientUtils.search.explore.prefetch({ q })

  return null
}

export default function Index() {
  const [searchParams] = useSearchParams()
  const { data: posts, isLoading } = trpc.search.explore.useQuery(
    {
      q: searchParams.get('q') || undefined,
    },
    {
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
