import { Link, useLocation, useNavigation } from '@remix-run/react'
import { useInfiniteQuery } from '@tanstack/react-query'
import { atom, useAtom } from 'jotai'
import React, { useEffect, useMemo, useRef, useState } from 'react'
// import {
//   HtmlPortalNode,
//   InPortal,
//   createHtmlPortalNode,
// } from 'react-reverse-portal'
import { StateSnapshot, Virtuoso, VirtuosoHandle } from 'react-virtuoso'
import { $path } from 'remix-routes'
import { LoadingIndicator } from '~/components/loading'
import { FeedResponse } from '~/routes/api.feed.$type.$id.($cursor)'
import type { FeedKeys } from '~/server/services/redis/keys'
import { Avatar } from '../avatar'
import { PostCard } from './post-card'
import { RepostedBy } from './reposted-by'
import { TimelineMessage } from './timeline-message'
import { PostCardModel } from './types'

type FeedProps = {
  id: string
  feedOwner?: {
    avatarUrl: string | undefined
    fullName?: string | undefined
    username: string
  }
  currentUser?: {
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
  const { queryKey = 'home', feedOwner, currentUser, id } = props

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isInitialLoading,
    isError,
  } = useInfiniteQuery(
    ['feed', queryKey, id],
    async ({ pageParam, meta }) => {
      const data = (await (
        await fetch(
          $path('/api/feed/:type/:id/:cursor?', {
            type: queryKey,
            cursor: pageParam,
            id: id,
          })
        )
      ).json()) as FeedResponse | { refresh: true }

      const shouldRefresh = 'refresh' in data
      const isRebuilding = 'rebuilding' in data

      return shouldRefresh || isRebuilding
        ? {
            shouldRefresh,
            isRebuilding,
            posts: [] as Extract<FeedResponse, { posts: any }>['posts'],
            nextCursor: undefined,
          }
        : {
            shouldRefresh: false,
            isRebuilding: false,
            posts: data?.posts || [],
            nextCursor: data?.nextCursor || undefined,
          }
    },
    {
      getNextPageParam: (lastPage, allPages) => {
        return lastPage.nextCursor
      },
      staleTime: 1000 * 60 * 2,
      cacheTime: Infinity,
      refetchOnWindowFocus: false,
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
      shouldRefresh: data?.pages.some((page) => page.shouldRefresh),
      isRebuilding: data?.pages.some((page) => page.isRebuilding),
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
                          // const mediaPortal = mediaPortals[post.id]
                          return (
                            <>
                              <PostCard
                                key={post.key}
                                item={post}
                                className="hover:bg-hover transition-all ease-in-out duration-300 cursor-pointer border-b border-gray-100 dark:border-gray-600"
                                footer={
                                  post.isThread ? (
                                    <div className="relative flex items-center p-4 gap-3 text-blue-400 font-light hover:bg-gray-100/80 dark:hover:bg-gray-800/10 cursor-pointer">
                                      <div className="basis-[40px]">
                                        <Avatar
                                          className="flex m-auto h-8 w-8 items-center justify-center rounded-full bg-gray-400"
                                          src={post.avatarUrl}
                                          alt=""
                                        />
                                      </div>
                                      <div className="">
                                        <span>Show this thread</span>
                                      </div>
                                    </div>
                                  ) : null
                                }
                              >
                                <div className="flex">
                                  <RepostedBy
                                    currentUser={currentUser}
                                    item={post}
                                  />
                                  {!post.repostedBy && post.parentPost ? (
                                    <div>
                                      <div className="-mt-1 text-sm text-secondary-text">
                                        <span className="text-[15px]">
                                          Replying to{' '}
                                          <Link
                                            className="link hover:underline"
                                            to={$path('/profile/:username', {
                                              username: post.parentPost.handle,
                                            })}
                                            onClick={(e) => {
                                              e.stopPropagation()
                                            }}
                                          >
                                            @{post.parentPost.handle}
                                          </Link>
                                        </span>
                                      </div>
                                      <div className="flex">
                                        <PostCard.InlinePostHeader />
                                      </div>
                                    </div>
                                  ) : (
                                    <PostCard.InlinePostHeader />
                                  )}

                                  <div className="ml-auto">
                                    <PostCard.ItemMenu />
                                  </div>
                                </div>

                                <PostCard.Content className="text-[15px]" />
                                <PostCard.MediaItems
                                  isScrolling={isScrolling}
                                  // portalNode={mediaPortal}
                                />

                                {post.monetization ? (
                                  <button className="w-full border-2 mt-4 border-primary-btn-300 py-2 text-[15px] font-semibold rounded-full flex items-center justify-center text-primary-btn-400">
                                    View campaign
                                  </button>
                                ) : null}
                                <PostCard.Actions />
                              </PostCard>
                            </>
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
