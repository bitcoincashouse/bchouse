import { LoaderFunctionArgs, MetaFunction } from '@remix-run/node'
import { useLocation, useParams } from '@remix-run/react'
import { generateText } from '@tiptap/core'
import { useMemo } from 'react'
import { $path } from 'remix-routes'
import {
  UseDataFunctionReturn,
  redirect,
  typedjson,
  useTypedLoaderData,
} from 'remix-typedjson'
import { z } from 'zod'
import { StandardLayout } from '~/components/layouts/standard-layout'
import { Thread } from '~/components/post/thread'
import { zx } from '~/utils/zodix'
import { getExtensions } from '../components/post/tiptap-extensions'
import { useLayoutLoaderData } from './_app/route'

export const handle = {
  title: 'Post',
  preventScrollRestoration: true,
  preventScrollReset: true,
  skipScrollRestoration: true,
}

export const loader = async (_: LoaderFunctionArgs) => {
  const { userId } = await _.context.authService.getAuthOptional(_)
  const { username, statusId: postId } = zx.parseParams(_.params, {
    username: z.string(),
    statusId: z.string(),
  })

  const { ancestors, mainPost, children, previousCursor, nextCursor } =
    await _.context.postService.getPostWithChildren(userId, postId)

  if (mainPost.monetization?.campaignId) {
    throw redirect(
      $path('/profile/:username/campaign/:statusId', {
        statusId: postId,
        username,
      })
    )
  }

  //TODO: Fetch parents dynamically
  return typedjson({
    posts: [
      ...ancestors.map((a) => ({ ...a, isThread: true })),
      mainPost,
      ...children,
    ],
    nextCursor: nextCursor,
    previousCursor,
  })
}

export const meta: MetaFunction = ({ data, location, matches, params }) => {
  const loaderData = data as UseDataFunctionReturn<typeof loader>
  const mainPost = loaderData.posts.find((p) => p.id === params.statusId)

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
}

export default function Index() {
  const { posts, previousCursor, nextCursor } =
    useTypedLoaderData<typeof loader>()
  const { statusId } = useParams()
  const layoutData = useLayoutLoaderData()
  const location = useLocation()
  const mainPost = useMemo(
    () => posts.find((post) => post.id === statusId),
    [posts]
  )

  if (!mainPost) {
    throw new Error('Error, main post not found!')
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
                    currentUser={
                      !layoutData.anonymousView ? layoutData.profile : undefined
                    }
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
