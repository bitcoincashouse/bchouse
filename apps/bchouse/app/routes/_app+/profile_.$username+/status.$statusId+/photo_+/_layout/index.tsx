import {
  ArrowLeftIcon,
  ArrowRightIcon,
  ChevronDoubleLeftIcon,
  ChevronDoubleRightIcon,
  XMarkIcon,
} from '@heroicons/react/24/solid'
import { LoaderFunctionArgs } from '@remix-run/node'
import { Link, Outlet, useNavigate, useParams } from '@remix-run/react'
import { AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import { $path } from 'remix-routes'
import { useMediaQuery } from 'usehooks-ts'
import { z } from 'zod'
import { PostFooter } from '~/components/post/card/implementations/image-cards'
import { ThreadProvider } from '~/components/thread-provider'
import { Thread } from '~/components/threads/thread'
import { classNames } from '~/utils/classNames'
import { zx } from '~/utils/zodix'
import { usePaginate } from './hooks/usePaginate'
import { preloadPostQuery, usePostQuery } from './hooks/usePostQuery'

export const handle: AppRouteHandle = {
  title: 'Post',
  preventScrollRestoration: true,
  preventScrollReset: true,
  skipScrollRestoration: true,
  containerClassName: 'z-[50]',
}

export const loader = async (_: LoaderFunctionArgs) => {
  const { username, statusId } = zx.parseParams(_.params, {
    username: z.string(),
    statusId: z.string(),
  })

  return preloadPostQuery(_, statusId)
}

export default function Page() {
  const navigate = useNavigate()
  const isMobile = useMediaQuery('(max-width: 690px)')
  const { data } = usePostQuery()
  const [collapsePosts, setCollapsePosts] = useState<boolean>(false)
  const { username, statusId, index } = useParams<{
    username: string
    statusId: string
    index: string
  }>()
  const { mainPost, ancestors = [], children = [] } = data || {}
  const { delta, direction, paginate, hasNext, hasPrevious } = usePaginate(
    mainPost?.mediaUrls || []
  )

  if (!mainPost) return null
  return (
    <div className="fixed w-full h-full inset-0">
      <div>
        <div
          className={classNames(
            'flex mx-auto non-mobile:mx-0 flex-row min-h-screen items-start w-screen non-mobile:w-auto'
          )}
        >
          <ThreadProvider
            ancestors={ancestors}
            main={mainPost}
            replies={children}
          >
            {!collapsePosts && !isMobile ? (
              <div className="hidden lg:block pt-2 min-[690px]:block w-[290px] min-[1080px]:w-[350px] relative order-last">
                <div className="divide-y divide-gray-200 dark:divide-gray-800 pb-[80vh]">
                  <div className="">
                    <Thread showImagesMainPost={false} key={mainPost.id} />
                  </div>
                </div>
              </div>
            ) : null}
          </ThreadProvider>
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
                    statusId: statusId!,
                    username: username!,
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
                <PostFooter
                  post={mainPost}
                  className="flex justify-around py-2"
                />
              </div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  )
}
