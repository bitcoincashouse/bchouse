import { useLocation, useNavigation } from '@remix-run/react'
import { atom, useAtom } from 'jotai'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { StateSnapshot, Virtuoso, VirtuosoHandle } from 'react-virtuoso'
import { useCurrentUser } from '~/components/context/current-user-context'
import { LoadingIndicator } from '~/components/loading'
import type { FeedKeys } from '~/server/services/services/redis/keys'
import { trpc } from '~/utils/trpc'
import { FeedCard } from '../post/card/implementations/feed-cards'
import { PostCardModel } from '../post/types'
import { TimelineMessage } from './timeline-message'

// import {
//   HtmlPortalNode,
//   InPortal,
//   createHtmlPortalNode,
// } from 'react-reverse-portal'

type FeedProps = {
  id: string
  feedOwner?: {
    avatarUrl: string | undefined
    fullName?: string | undefined
    username: string
  }
}

const feedStateAtom = atom({} as Record<string, StateSnapshot>)
// const mediaPortalsStateAtom = atom({} as Record<string, HtmlPortalNode>)

// function IFramelyPlaceholder({ post }: { post: PostCardModel }) {
//   const [mediaPortals, setMediaPortals] = useAtom(mediaPortalsStateAtom)
//   const portalNode = React.useMemo(() => createHtmlPortalNode(), [])

//   useEffect(() => {
//     if (!mediaPortals[post.id]) {
//       setMediaPortals((mediaPortals) => {
//         return Object.assign({}, mediaPortals, { [post.id]: portalNode })
//       })
//     }
//   }, [])

//   return (
//     <InPortal node={portalNode}>
//       <Iframely url={post.embed as string} allowFullHeight={true} />
//     </InPortal>
//   )
// }

export const Feed: React.FC<
  FeedProps & {
    queryKey?: FeedKeys
  }
> = (props) => {
  const { queryKey = 'home', feedOwner, id } = props
  const currentUser = useCurrentUser()

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isInitialLoading,
    isError,
  } = trpc.post.feed.useInfiniteQuery(
    {
      id,
      type: queryKey,
    },
    {
      staleTime: 1000 * 60 * 2,
      gcTime: Infinity,
      refetchOnWindowFocus: false,
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    }
  )

  const feedRef = useRef<VirtuosoHandle>()
  const location = useLocation()
  const [feedState, setFeedState] = useAtom(feedStateAtom)
  // const [mediaPortals, setMediaPortals] = useAtom(mediaPortalsStateAtom)
  const navigation = useNavigation()

  useEffect(() => {
    if (navigation.location) {
      feedRef.current?.getState((state) => {
        setFeedState({
          ...feedState,
          [location.key]: state,
        })
      })
    }
  }, [navigation?.location])

  const { posts, shouldRefresh, isRebuilding } = useMemo(() => {
    return {
      posts:
        (data?.pages
          .flatMap((page) => page.posts)
          .filter((p) => !p.deleted) as PostCardModel[]) || [],
      shouldRefresh: data?.pages.some((page) => page.refresh),
      isRebuilding: data?.pages.some((page) => page.rebuilding),
    }
  }, [data])

  const [isScrolling, setIsScrolling] = useState(false)

  return (
    <div>
      <div>
        {/* {posts.map((p) => {
          return p.embed ? <IFramelyPlaceholder post={p} key={p.id} /> : null
        })} */}

        <div>
          <div className="">
            <div className="">
              {/* Activity feed*/}
              <div className="flow-root">
                <>
                  {isInitialLoading || posts.length ? (
                    <ul
                      role="list"
                      className="divide-y divide-gray-100 dark:divide-gray-700"
                    >
                      <Virtuoso
                        ref={feedRef as React.MutableRefObject<VirtuosoHandle>}
                        useWindowScroll
                        overscan={500}
                        increaseViewportBy={500}
                        isScrolling={setIsScrolling}
                        data={posts}
                        itemContent={(index, post) => {
                          return (
                            <FeedCard post={post} isScrolling={isScrolling} />
                          )
                        }}
                        restoreStateFrom={feedState[location.key]}
                        endReached={() => fetchNextPage()}
                        components={{
                          Footer: () =>
                            isLoading ? (
                              <div className="relative w-full loading pt-2 pb-2">
                                <div className="flex justify-center">
                                  <LoadingIndicator />
                                </div>
                              </div>
                            ) : (
                              <></>
                            ),
                        }}
                      />
                    </ul>
                  ) : shouldRefresh || isError ? (
                    <TimelineMessage
                      message="Something went wrong."
                      actionMessage="Please refresh the page"
                    />
                  ) : isRebuilding ? (
                    <TimelineMessage
                      message="We're rebuilding the timeline..."
                      actionMessage="Please come back later"
                    />
                  ) : (
                    <TimelineMessage
                      message=" No posts yet"
                      actionMessage={
                        <p className="text-gray-400">
                          When{' '}
                          {!feedOwner
                            ? 'someone posts'
                            : feedOwner.username === currentUser?.username
                            ? 'you post'
                            : `@${feedOwner.username} posts`}
                          , you’ll see it here.
                        </p>
                      }
                    />
                  )}
                </>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
