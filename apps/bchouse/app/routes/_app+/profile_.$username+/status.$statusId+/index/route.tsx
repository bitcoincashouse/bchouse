import { logger } from '@bchouse/utils'
import { LoaderFunctionArgs } from '@remix-run/node'
import {
  ClientLoaderFunctionArgs,
  MetaFunction,
  useLocation,
  useParams,
} from '@remix-run/react'
import { $preload, $useLoaderQuery, createRemixClientUtils } from 'remix-query'
import { z } from 'zod'
import { StandardLayout } from '~/components/layouts/standard-layout'
import { Thread } from '~/components/threads/thread'
import { zx } from '~/utils/zodix'
import { createMetaTags } from './createMetaTags'

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

  return $preload(_, '/api/post/status/:statusId', {
    statusId,
  })
}

export const clientLoader = async (_: ClientLoaderFunctionArgs) => {
  return null
}

export const meta: MetaFunction<typeof loader> = ({
  data,
  location,
  matches,
  params,
}) => {
  try {
    const queryClient = data
      ? createRemixClientUtils(data)
      : window.remixQueryClientUtils

    const result = queryClient.getData('/api/post/status/:statusId', {
      statusId: params.statusId as string,
    })

    const mainPost = result?.posts.find((p) => p.id === params.statusId)
    if (mainPost) {
      return createMetaTags(mainPost, params)
    }
  } catch (err) {
    logger.error(err)
  }

  return []
}

function useThreadQuery() {
  const { username, statusId } = useParams<{
    username: string
    statusId: string
  }>()

  return $useLoaderQuery('/api/post/status/:statusId', {
    params: {
      statusId: statusId!,
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    select(data) {
      return {
        ...data,
        mainPost: data.posts.find((post) => post.id === statusId),
      }
    },
  })
}

export default function Index() {
  const status = useThreadQuery()
  const location = useLocation()

  const {
    mainPost,
    posts = [],
    previousCursor = undefined,
    nextCursor = undefined,
  } = status.data || {}

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
