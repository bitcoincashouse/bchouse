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
import { ThreadProvider } from '~/components/thread-provider'
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

    if (result?.mainPost) {
      return createMetaTags(result.mainPost, params)
    }
  } catch (err) {
    logger.error(err)
  }

  return []
}

//TODO: use the '/api/post/get/:postId' endpoint for the main post
// fetch ancestors and replies separately but allow rendering
// First, ensure that loading ancestors and replies after main post allows scrolling
// Then, ensure that /api/post/status/:statusId mainPost field returns same information as /api/post/get/:postId
// If not, at least a supertype of /api/post/get/:postId (or transformed)
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
    enabled: !!statusId,
  })
}

export default function Index() {
  const status = useThreadQuery()
  const location = useLocation()

  const {
    mainPost = undefined,
    ancestors = [],
    children = [],
  } = status.data || {}

  if (!mainPost) return null

  return (
    <ThreadProvider ancestors={ancestors} main={mainPost} replies={children}>
      <StandardLayout
        title={'Post'}
        main={
          <>
            <div>
              <div>
                <div className="divide-y divide-gray-200 dark:divide-gray-800 pb-[80vh]">
                  <div className="">
                    <Thread key={location.pathname} />
                  </div>
                </div>
              </div>
            </div>
          </>
        }
      ></StandardLayout>
    </ThreadProvider>
  )
}
