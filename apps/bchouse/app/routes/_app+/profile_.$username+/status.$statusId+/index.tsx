import { logger } from '@bchouse/utils'
import { LoaderFunctionArgs, MetaFunction } from '@remix-run/node'
import {
  ClientLoaderFunctionArgs,
  useLocation,
  useParams,
} from '@remix-run/react'
import { generateText } from '@tiptap/core'
import { useMemo } from 'react'
import { z } from 'zod'
import { StandardLayout } from '~/components/layouts/standard-layout'
import { Thread } from '~/components/post/thread'
import { getExtensions } from '~/components/post/tiptap-extensions'
import { createTrpcClientUtils, trpc } from '~/utils/trpc'
import { zx } from '~/utils/zodix'

export const handle = {
  title: 'Post',
  preventScrollRestoration: true,
  preventScrollReset: true,
  skipScrollRestoration: true,
}

export const loader = async (_: LoaderFunctionArgs) => {
  const { username, statusId } = zx.parseParams(_.params, {
    username: z.string(),
    statusId: z.string(),
  })

  await _.context.trpc.post.status.prefetch({
    username,
    statusId,
  })

  return _.context.getDehydratedState()
}

export const clientLoader = async (_: ClientLoaderFunctionArgs) => {
  const { username, statusId } = zx.parseParams(_.params, {
    username: z.string(),
    statusId: z.string(),
  })

  await window.trpcClientUtils.post.status.prefetch({
    username,
    statusId,
  })

  return null
}

export const meta: MetaFunction<typeof loader> = ({
  data,
  location,
  matches,
  params,
}) => {
  try {
    const trpcClientUtils = data
      ? createTrpcClientUtils(
          data?.dehydratedState! as Awaited<
            ReturnType<typeof loader>
          >['dehydratedState']
        )
      : window.trpcClientUtils

    const result = trpcClientUtils.post.status.getData({
      username: params.username as string,
      statusId: params.statusId as string,
    })!

    if (!result) {
      return []
    }

    const posts = result.posts

    const mainPost = posts.find((p) => p.id === params.statusId)

    if (!mainPost) return []

    const author = mainPost.person.name || mainPost.person.handle
    let content = 'A post on BCHouse by ' + author

    try {
      content = generateText(
        mainPost.content,
        getExtensions('Placeholder', () => {})
      ).substring(0, 200)
    } catch (err) {}

    const title =
      (mainPost.person.name
        ? `${mainPost.person.name} (@${mainPost.person.handle})`
        : mainPost.person.handle) + ' on BCHouse'

    const logoUrl = 'https://bchouse.fly.dev/assets/images/bchouse.png'
    const url = `https://bchouse.fly.dev/profile/${params.username}/status/${params.statusId}`
    const author_url = `https://bchouse.fly.dev/profile/${params.username}`

    return [
      { title },
      { name: 'description', content: content },
      { name: 'lang', content: 'en' },
      { name: 'author', content: author },
      { name: 'author_url', content: author_url },
      { name: 'site', content: 'BCHouse' },
      { name: 'canonical', content: url },

      { name: 'og:title', content: title },
      { name: 'og:description', content: content },
      { name: 'og:site_name', content: 'BCHouse' },
      { name: 'og:url', content: url },
      { name: 'og:image:url', content: logoUrl },
      { name: 'og:image:type', content: 'image/png' },
      { name: 'og:image:width', content: 534 },
      { name: 'og:image:height', content: 94 },
      { name: 'og:image:alt', content: 'BCHouse Logo' },

      { name: 'twitter:card', content: content },
      { name: 'twitter:site', content: 'BCHouse' },
      { name: 'twitter:title', content: title },
      { name: 'twitter:description', content: content },
      { name: 'twitter:image', content: logoUrl },
    ]
  } catch (err) {
    logger.error(err)
    return []
  }
}

export default function Index() {
  const { username, statusId } = useParams<{
    username: string
    statusId: string
  }>()

  const status = trpc.post.status.useQuery(
    {
      username: username!,
      statusId: statusId!,
    },
    {
      staleTime: 5 * 60 * 1000,
      gcTime: 15 * 60 * 1000,
    }
  )

  const {
    posts = [],
    previousCursor = undefined,
    nextCursor = undefined,
  } = status.data || {}

  const location = useLocation()
  const mainPost = useMemo(
    () => posts.find((post) => post.id === statusId),
    [posts]
  )

  if (!mainPost) {
    logger.error('Error, main post not found!')
    return null
  }

  return (
    <StandardLayout
      title={'Post'}
      main={
        <>
          <div>
            <div>
              <div className="divide-y divide-gray-200 dark:divide-gray-800 pb-[80vh]">
                <div className="">
                  <Thread
                    mainPost={mainPost}
                    key={location.pathname}
                    previousCursor={previousCursor}
                    nextCursor={nextCursor}
                    initialPosts={posts}
                  />
                </div>
              </div>
            </div>
          </div>
        </>
      }
    ></StandardLayout>
  )
}
