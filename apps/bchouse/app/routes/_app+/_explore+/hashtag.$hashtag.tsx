import { LoaderFunctionArgs, redirect } from '@remix-run/node'
import { UIMatch } from '@remix-run/react'
import { z } from 'zod'
import { getTrpc } from '~/.server/getTrpc'
import { StandardPostCard } from '~/components/post/card/implementations/standard-post-card'
import { trpc } from '~/utils/trpc'
import { zx } from '~/utils/zodix'

export const handle = {
  query: (match: UIMatch) => {
    return '#' + match.params.hashtag
  },
}

export const loader = async (_: LoaderFunctionArgs) => {
  const { hashtag } = zx.parseParams(_.params, {
    hashtag: z.string().optional(),
  })

  if (!hashtag) throw redirect('/explore')

  return getTrpc(_, (trpc) => trpc.search.searchHashtag.prefetch())
}

export default function Index() {
  const posts = trpc.search.searchHashtag.useQuery({}, {})

  return (
    <>
      {posts.length ? (
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
