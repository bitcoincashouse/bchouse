import {
  ArrowLeftIcon,
  ArrowRightIcon,
  ChevronDoubleLeftIcon,
  ChevronDoubleRightIcon,
  XMarkIcon,
} from '@heroicons/react/24/solid'
import { LoaderArgs } from '@remix-run/node'
import {
  Link,
  Outlet,
  useLocation,
  useNavigate,
  useParams,
} from '@remix-run/react'
import { AnimatePresence } from 'framer-motion'
import { useMemo, useState } from 'react'
import { $path, $routeId } from 'remix-routes'
import {
  typedjson,
  useTypedLoaderData,
  useTypedRouteLoaderData,
} from 'remix-typedjson'
import { useMediaQuery } from 'usehooks-ts'
import { z } from 'zod'
import { PostCard, PostProvider } from '~/components/post/post-card'
import { Thread } from '~/components/post/thread'
import { classNames } from '~/utils/classNames'
import { zx } from '~/utils/zodix'
import { useLayoutLoaderData } from './_app/route'

export const handle: AppRouteHandle = {
  title: 'Post',
  preventScrollRestoration: true,
  preventScrollReset: true,
  skipScrollRestoration: true,
  containerClassName: 'z-[50]',
}

export const usePhotoLoaderData = () => {
  return useTypedRouteLoaderData<typeof loader>(
    $routeId('routes/_app.profile_.$username.status.$statusId_.photo')
  )
}

export const loader = async (_: LoaderArgs) => {
  const { userId } = await _.context.authService.getAuthOptional(_)
  const { username, statusId: postId } = zx.parseParams(_.params, {
    username: z.string(),
    statusId: z.string(),
  })

  const { ancestors, mainPost, children, previousCursor, nextCursor } =
    await _.context.postService.getPostWithChildren(userId, postId)

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

export default function Page() {
  const { posts, previousCursor, nextCursor } =
    useTypedLoaderData<typeof loader>()
  const params = useParams()
  const photoNum = Number(params.index as string)
  const imageIndex = photoNum - 1

  const [collapsePosts, setCollapsePosts] = useState<boolean>(false)
  const navigate = useNavigate()
  const layoutData = useLayoutLoaderData()
  const location = useLocation()

  const mainPost = useMemo(
    () => posts.find((post) => post.id === params.statusId),
    [posts]
  )

  if (!mainPost) return null

  const delta = location.state?.delta as number | undefined
  const direction = location.state?.direction as -1 | 1 | undefined
  const hasPrevious = !!mainPost.mediaUrls[imageIndex - 1]
  const hasNext = !!mainPost.mediaUrls[imageIndex + 1]

  const paginate = (direction: -1 | 1) => {
    if ((direction === -1 && hasPrevious) || (direction === 1 && hasNext)) {
      navigate(
        $path('/profile/:username/status/:statusId/photo/:index', {
          statusId: params.statusId as string,
          username: params.username as string,
          index: photoNum + direction,
        }),
        {
          state: {
            delta: typeof delta !== 'undefined' ? delta + 1 : undefined,
            direction,
          },
        }
      )
    }
  }

  const isMobile = useMediaQuery('(max-width: 690px)')

  return (
    <div className="fixed w-full h-full inset-0">
      <div>
        <div
          className={classNames(
            'flex mx-auto non-mobile:mx-0 flex-row min-h-screen items-start w-screen non-mobile:w-auto'
          )}
        >
          {!collapsePosts && !isMobile ? (
            <div className="hidden lg:block pt-2 min-[690px]:block w-[290px] min-[1080px]:w-[350px] relative order-last">
              <div className="divide-y divide-gray-200 dark:divide-gray-800 pb-[80vh]">
                <div className="">
                  <Thread
                    showImagesMainPost={false}
                    mainPost={mainPost}
                    key={mainPost.id}
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
          ) : null}
          <div
            className={classNames(
              'relative w-full non-mobile:border !border-t-0 border-gray-100 dark:border-gray-600 dark:border-gray-600'
            )}
          >
            <div className="z-10 absolute top-0 left-0 mt-4 ml-4">
              {typeof delta !== 'undefined' ? (
                <button onClick={() => navigate(-delta)}>
                  <XMarkIcon className="w-6" />
                </button>
              ) : (
                <Link
                  to={$path('/profile/:username/status/:statusId', {
                    statusId: params.statusId as string,
                    username: params.username as string,
                  })}
                  prefetch="render"
                >
                  <XMarkIcon className="w-6" />
                </Link>
              )}
            </div>
            {!isMobile ? (
              <div className="z-10 absolute top-0 right-0 mt-4 mr-4">
                {collapsePosts ? (
                  <button onClick={() => setCollapsePosts(false)}>
                    <ChevronDoubleLeftIcon className="w-6" />
                  </button>
                ) : (
                  <button onClick={() => setCollapsePosts(true)}>
                    <ChevronDoubleRightIcon className="w-6" />
                  </button>
                )}
              </div>
            ) : null}
            {hasPrevious ? (
              <div className="z-10 absolute top-1/2 left-0 mt-4 ml-4">
                <button onClick={() => paginate(-1)}>
                  <ArrowLeftIcon className="w-6" />
                </button>
              </div>
            ) : null}
            {hasNext ? (
              <div className="z-10 absolute top-1/2 right-0 mt-4 mr-4">
                <button onClick={() => paginate(1)}>
                  <ArrowRightIcon className="w-6" />
                </button>
              </div>
            ) : null}
            <AnimatePresence initial={false} custom={direction}>
              <div className="relative flex flex-col px-16 overflow-hidden min-h-screen bg-primary">
                <div className="flex-grow relative">
                  <Outlet />
                </div>
                <PostProvider item={mainPost}>
                  <PostCard.Actions className="flex justify-around py-2" />
                </PostProvider>
              </div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  )
}
