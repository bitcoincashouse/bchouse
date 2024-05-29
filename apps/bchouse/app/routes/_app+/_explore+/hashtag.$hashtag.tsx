import { LoaderFunctionArgs, redirect } from '@remix-run/node'
import { UIMatch, useParams } from '@remix-run/react'
import { $preload } from 'remix-query'
import { z } from 'zod'
import { StandardPostCard } from '~/components/post/card/implementations/standard-post-card'
import { zx } from '~/utils/zodix'
import { useSearchHashtagQuery } from './_layout/hooks/useSearchHashtagQuery'

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

  return $preload(_, '/api/search/hashtag/:hashtag', { hashtag })
}

export default function Index() {
  const { hashtag } = useParams()
  const { data: posts } = useSearchHashtagQuery()

  return (
    <>
      {posts?.length ? (
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
