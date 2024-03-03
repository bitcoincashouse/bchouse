import { moment, prettyPrintSats } from '@bchouse/utils'
import { HeartIcon } from '@heroicons/react/24/outline'
import { Link, useLocation } from '@remix-run/react'
import React, { useMemo, useRef, useState } from 'react'
import { Virtuoso, VirtuosoHandle } from 'react-virtuoso'
import { $path } from 'remix-routes'
import { useBrowserLayoutEffect } from '~/utils/useBrowserLayoutEffect'
import { Avatar } from '../avatar'
import { classnames } from '../utils/classnames'
import { PostForm } from './post-form'
import { Post } from './threads/post'
import { useFeedState, useInfiniteScroll } from './threads/useInfiniteScroll'
import { useScrollRestore } from './threads/useScrollRestore'
import { TimelineMessage } from './timeline-message'
import { PostCardModel } from './types'

type DonorPost = {
  anonymousName: string | null
  username: string | null
  firstName: string | null
  lastName: string | null
  avatarUrl: string | null
  comment: string
  pledgeAmount: bigint
  createdAt: Date
}

const tabs = [
  { name: 'Donors', id: 'donors' },
  { name: 'All', id: 'all' },
] as const

export const CampaignThread: React.FC<{
  mainPost: PostCardModel
  ancestorPosts: PostCardModel[]
  childPosts: PostCardModel[]
  donorPosts: DonorPost[]
  nextCursor?: string | undefined
  previousCursor?: string | undefined
  currentUser?: {
    username: string
    avatarUrl: string | undefined
  }
  isPledgeModalOpen: boolean
  openPledgeModal: () => void
}> = (props) => {
  const {
    mainPost,
    currentUser,
    childPosts,
    donorPosts,
    ancestorPosts,
    openPledgeModal,
    isPledgeModalOpen,
  } = props

  const mainPostId = mainPost.id

  const ancestorFeedState = useInfiniteScroll({
    initialPosts: ancestorPosts.concat([mainPost]),
    mainPostId,
    key: 'ancestors',
  })

  const [activeTabId, setActiveTabId] = useState<'all' | 'donors'>(
    mainPost.monetization?.campaignId ? 'donors' : 'all'
  )

  const location = useLocation()
  const [childrenRendered, setChildrenRendered] = useState(false)
  const [showThread, setShowThread] = useState(false)

  const isDone = useMemo(
    () =>
      mainPost.monetization
        ? !!mainPost.monetization.fulfilledAt ||
          mainPost.monetization.expiresAt <= moment().unix()
        : false,
    [mainPost.monetization]
  )

  const listRef = useRef<HTMLUListElement | null>(null)

  const scrollState = useScrollRestore()
  const [wasRendered, setWasRendered] = useState(false)
  useBrowserLayoutEffect(() => {
    if (typeof window === 'undefined') return

    if (scrollState) {
      window.scrollTo({ top: scrollState })
    } else {
      const mainPost = listRef.current?.querySelector(
        '#currentPost'
      ) as HTMLDivElement

      if (mainPost) {
        const targetOffset =
          mainPost.offsetTop + (window.innerWidth >= 640 ? -60 : 0)

        window.scrollTo({ top: targetOffset, behavior: 'instant' })
      }
    }
    setWasRendered(true)
  }, [])

  return (
    <div>
      <div>
        <div>
          <div className="">
            <div className="">
              {/* Activity feed*/}
              <div className="flow-root">
                <ul
                  role="list"
                  ref={listRef}
                  className={classnames(
                    'divide-y divide-gray-100 dark:divide-gray-700 border-gray-100 dark:border-gray-600 min-h-screen flex flex-col',
                    !wasRendered && 'invisible'
                  )}
                >
                  <div>
                    {ancestorFeedState.posts.map((post) => (
                      <Post
                        key={post.key}
                        mainPostId={mainPostId}
                        post={post}
                        currentUser={currentUser}
                        actionButton={
                          post.id === mainPostId ? (
                            <PledgeButton
                              onClick={(e) => {
                                e.stopPropagation()
                                openPledgeModal()
                              }}
                              disabled={isPledgeModalOpen || isDone}
                              isLoggedIn={!!currentUser}
                            />
                          ) : null
                        }
                      />
                    ))}

                    <>
                      <section
                        aria-labelledby="applicant-information-title"
                        className="border-b border-gray-100 dark:border-gray-600 max-w-full overflow-x-auto"
                      >
                        <div>
                          <div className="px-4 sm:px-6">
                            <div className="overflow-x-auto h-full overflow-y-hidden">
                              <div className="flex mx-auto max-w-5xl">
                                <nav
                                  className={classnames(
                                    'flex justify-around space-x-8 flex-1'
                                  )}
                                  aria-label="Tabs"
                                >
                                  {tabs.map((tab, i) => {
                                    return (
                                      <button
                                        key={tab.name}
                                        onClick={() => setActiveTabId(tab.id)}
                                        className={classnames(
                                          tab.id === activeTabId
                                            ? 'border-pink-500 text-primary-text'
                                            : 'border-transparent text-secondary-text hover:border-gray-300 hover:dark:text-secondary-text',
                                          'whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium'
                                        )}
                                      >
                                        {tab.name}
                                      </button>
                                    )
                                  })}
                                </nav>
                              </div>
                            </div>
                          </div>
                        </div>
                      </section>

                      {!mainPost.deleted && currentUser ? (
                        <div
                          className={classnames(
                            'px-4 py-6 sm:px-6 border-b border-gray-100 dark:border-gray-600',
                            activeTabId === 'all' ? '' : 'hidden'
                          )}
                        >
                          <PostForm
                            user={currentUser}
                            placeholder="Post a reply!"
                            parentPost={{
                              id: mainPost.id,
                              publishedById: mainPost.publishedById,
                            }}
                            heading={
                              <div className="text-gray-600">
                                <span>
                                  Replying to{' '}
                                  <Link
                                    className="link"
                                    to={$path('/profile/:username', {
                                      username: mainPost.person.handle,
                                    })}
                                  >
                                    @{mainPost.person.handle}
                                  </Link>
                                </span>
                              </div>
                            }
                          />
                        </div>
                      ) : null}

                      {activeTabId === 'all' ? (
                        <>
                          <AllComments
                            childPosts={childPosts}
                            currentUser={currentUser}
                          />
                        </>
                      ) : (
                        <DonorComments childPosts={donorPosts} />
                      )}
                    </>
                  </div>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function DonorComments({ childPosts }: { childPosts: DonorPost[] }) {
  const childFeedState = useFeedState({
    key: 'donor_comments',
  })

  return childPosts.length ? (
    <Virtuoso
      ref={childFeedState.feedRef as React.MutableRefObject<VirtuosoHandle>}
      restoreStateFrom={childFeedState.feedState}
      className="grow"
      useWindowScroll
      data={childPosts}
      itemContent={(index, item) => {
        return <ContributionComment item={item} />
      }}
    />
  ) : (
    <TimelineMessage
      message=" No posts yet"
      actionMessage={
        <p className="text-gray-400">
          When a donor leaves a message, you’ll see it here.
        </p>
      }
    />
  )
}

function PledgeButton({
  onClick,
  disabled,
  isLoggedIn,
}: {
  onClick: React.MouseEventHandler
  disabled: boolean
  isLoggedIn: boolean
}) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className={classnames(
        'desktop:hidden disabled:!bg-gray-300 rounded-full text-primary-text font-semibold text-[15px] px-2 bg-primary-btn-300 hover:bg-primary-btn-400 gradient transition-all duration-400 ease-in-out'
      )}
    >
      {isLoggedIn ? 'Pledge' : 'Donate'}
    </button>
  )
}

function ContributionComment({ item }: { item: DonorPost }) {
  const [amount, denomination] = prettyPrintSats(
    Number(item.pledgeAmount),
    'BCH'
  )

  const name = useMemo(() => {
    if (item.firstName || item.lastName) {
      return [item.firstName, item.lastName].filter(Boolean).join(' ')
    }

    if (item.username) {
      return item.username
    }

    if (item.anonymousName) {
      return item.anonymousName
    }

    return 'Anonymous'
  }, [item])

  return (
    <div>
      <div className="relative py-4 px-4">
        <div className="relative flex flex-row items-start gap-4">
          {item.avatarUrl ? (
            <Avatar src={item.avatarUrl} className="w-10 h-10" />
          ) : (
            <div className="bg-gray-300 dark:bg-hover rounded-full p-2">
              <HeartIcon className="w-6 h-6" />
            </div>
          )}
          <div className="relative flex flex-col items-start gap-2">
            <div className="min-w-0 flex-1 relative">
              <span className="font-bold text-primary-text">{name}</span>
              <div>
                <span className="text-sm">
                  {amount}
                  <small className="text-xs">{denomination}</small>
                </span>{' '}
                <span className="before:content-['\2022'] text-secondary-text" />{' '}
                <span className="text-sm text-secondary-text">
                  {moment(item.createdAt).fromNow()}
                </span>
              </div>
            </div>
            <div>
              <span>{item.comment}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
function AllComments({
  childPosts,
  currentUser,
}: {
  childPosts: PostCardModel[]
  currentUser?: {
    username: string
    avatarUrl: string | undefined
  }
}) {
  const childFeedState = useFeedState({
    key: 'all_comments',
  })

  return childPosts.length ? (
    <Virtuoso
      ref={childFeedState.feedRef as React.MutableRefObject<VirtuosoHandle>}
      useWindowScroll
      restoreStateFrom={childFeedState.feedState}
      data={childPosts}
      itemContent={(index, post) => {
        return <Post mainPostId={''} post={post} currentUser={currentUser} />
      }}
    />
  ) : (
    <TimelineMessage
      message=" No posts yet"
      actionMessage={
        <p className="text-gray-400">
          When someone leaves a post, you’ll see it here.
        </p>
      }
    />
  )
}
