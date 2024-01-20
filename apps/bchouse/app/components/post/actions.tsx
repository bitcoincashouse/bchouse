import {
  ArrowPathRoundedSquareIcon,
  BookmarkIcon,
  ChatBubbleLeftRightIcon,
  HeartIcon,
  ShareIcon,
} from '@heroicons/react/24/outline'
import { Fetcher, Link, useFetcher } from '@remix-run/react'
import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo } from 'react'
import { $path } from 'remix-routes'
import { Network } from '~/utils/bchUtils'
import { pluralize } from '~/utils/pluralize'
import { prettyPrintSats } from '~/utils/prettyPrintSats'
import { BitcoinIcon } from '../icons/BitcoinIcon'
import { useTipPostModal } from '../tip-modal'
import { classNames } from '../utils'
import { classnames } from '../utils/classnames'
import { PostCardModel } from './types'

export function Actions({ item }: { item: PostCardModel }) {
  const percentRaised = useMemo(() => {
    return item.monetization?.amount
      ? Math.floor(
          (item.monetization?.raised / item.monetization?.amount) * 100
        )
      : 0
  }, [item.monetization])

  const [goal, goalDenomination] = useMemo(() => {
    return item.monetization
      ? prettyPrintSats(item.monetization.amount)
      : ([0, 'BCH'] as const)
  }, [item.monetization])

  const [tipAmountStr, tipDenomiation] = useMemo(() => {
    return prettyPrintSats(item.tipAmount || 0)
  }, [item.monetization])

  return (
    <div className="px-4">
      <div className="divide-y divide-gray-100 dark:divide-gray-700 border-y border-gray-100 dark:border-gray-600">
        <div
          className={classnames(
            'flex flex-row gap-8 p-4 overflow-x-auto'
            // item.monetization && 'justify-center lg:justify-start'
          )}
        >
          {item.monetization ? (
            <>
              <span>
                <span>
                  {goal}
                  <small>
                    {goalDenomination === 'SATS' ? 'SAT' : goalDenomination}
                  </small>
                </span>{' '}
                <span className="text-sm text-gray-600">Goal</span>
              </span>
              <span>
                <span>{percentRaised}</span>
                <small>%</small>{' '}
                <span className="text-sm text-gray-600">Raised</span>
              </span>
              <span>
                <span>{item.monetization.contributionCount}</span>{' '}
                <span className="text-sm text-gray-600">
                  {pluralize({
                    count: item.monetization.contributionCount,
                    singular: 'Donor',
                    plural: 'Donors',
                  })}
                </span>
              </span>
            </>
          ) : null}
          <span>
            {<span>{item && !item.deleted ? item.likeCount || 0 : 0}</span>}{' '}
            <span className="text-sm text-gray-600">Likes</span>
          </span>
          <span>
            <span>{item && !item.deleted ? item.repostCount || 0 : 0}</span>{' '}
            <span className="text-sm text-gray-600">Reposts</span>
          </span>
          {!item.monetization ? (
            <span>
              {<span>{item && !item.deleted ? item.quoteCount || 0 : 0}</span>}{' '}
              <span className="text-sm text-gray-600">Quotes</span>
            </span>
          ) : null}
          {item.person.bchAddress && item.person.network ? (
            <span>
              {
                <span>
                  {item && !item.deleted && item.tipAmount ? (
                    <>
                      {tipAmountStr}
                      <small>{tipDenomiation}</small>
                    </>
                  ) : (
                    0
                  )}
                </span>
              }{' '}
              <span className="text-sm text-gray-600">Tips</span>
            </span>
          ) : null}
        </div>
        <div className="flex flex-row justify-around gap-8 p-2 text-base text-secondary-text">
          <CommentsButton item={item} />
          <RepostButton item={item} />
          <LikeButton item={item} />
          {item.person.bchAddress && item.person.network ? (
            <TipButton item={item} />
          ) : null}
          {/* <BookmarkButton item={item} /> */}
          <ShareButton item={item} />
          {/* <ViewCounts item={item} /> */}
        </div>
      </div>
    </div>
  )
}

function useInvalidateFeedPage(fetcher: Fetcher, postId: string) {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (
      typeof fetcher.formData !== 'undefined' &&
      fetcher.state !== 'submitting'
    ) {
      queryClient.invalidateQueries({
        //TODO: invalidate the feed we're on whether home, profile (username + index/replies/likes/media)
        queryKey: ['feed'],
        refetchPage: (page: { posts: { id: string }[] }, i, all) => {
          return page.posts.some((post) => post.id === postId)
        },
      })
    }
  }, [
    typeof fetcher.formData !== 'undefined' && fetcher.state !== 'submitting',
  ])
}

export function CardAction({
  action,
  item,
  children,
}: {
  action: string
  children: React.ReactNode
  item: PostCardModel
}) {
  const fetcher = useFetcher()
  useInvalidateFeedPage(fetcher, item.id)

  return (
    <fetcher.Form
      method="POST"
      action={action}
      preventScrollReset={true}
      onSubmit={(e) => {
        if (item.deleted) {
          e.preventDefault()
        }
      }}
      className="items-center flex"
    >
      {children}
    </fetcher.Form>
  )
}

export function CommentsButton({ item }: { item: PostCardModel }) {
  return (
    <Link
      to={{ search: `?modal=reply&postId=${item.id}` }}
      state={{ replyToPost: item }}
      preventScrollReset={true}
      replace={true}
      onClick={(e) => {
        if (item.deleted) {
          e.preventDefault()
        }
        e.stopPropagation()
      }}
      className="inline-flex gap-1 items-center cursor-pointer group"
      title="Comment"
    >
      <ChatBubbleLeftRightIcon
        title="Comment"
        className="w-6 h-6 group-hover:ring-8 group-hover:bg-blue-600/20 group-hover:ring-blue-600/20 rounded-full transition-all ease-in-out duration-300"
      />
    </Link>
  )
}

export function RepostButton({ item }: { item: PostCardModel }) {
  const fetcher = useFetcher()
  useInvalidateFeedPage(fetcher, item.id)

  const toggled =
    typeof fetcher.formData?.get('_action') !== 'undefined'
      ? fetcher.formData.get('_action') === 'addRepost'
      : item.wasReposted

  return (
    <fetcher.Form
      method="POST"
      action={$path('/api/post/:postId/retweet', { postId: item.id })}
      preventScrollReset={true}
      onSubmit={(e) => {
        if (item.deleted) {
          e.preventDefault()
        }
      }}
      className="items-center flex"
    >
      <input type="hidden" name="postAuthorId" value={item.publishedById} />
      <button
        type="submit"
        name="_action"
        onClick={(e) => e.stopPropagation()}
        value={toggled ? 'removeRepost' : 'addRepost'}
        className={classNames(
          'inline-flex gap-1 items-center cursor-pointer group',
          toggled ? 'text-emerald-600' : ''
        )}
        title={toggled ? 'Unrepost' : 'Repost'}
      >
        <ArrowPathRoundedSquareIcon
          title={toggled ? 'Unrepost' : 'Repost'}
          className="w-6 h-6 group-hover:ring-8 group-hover:bg-emerald-600/20 group-hover:ring-emerald-600/20 rounded-full transition-all ease-in-out duration-300"
        />
      </button>
    </fetcher.Form>
  )
}

export function LikeButton({ item }: { item: PostCardModel }) {
  const fetcher = useFetcher()
  useInvalidateFeedPage(fetcher, item.id)

  const toggled =
    typeof fetcher.formData?.get('_action') !== 'undefined'
      ? fetcher.formData.get('_action') === 'addLike'
      : item.wasLiked

  return (
    <fetcher.Form
      method="POST"
      action={$path('/api/post/:postId/like', { postId: item.id })}
      preventScrollReset={true}
      onSubmit={(e) => {
        if (item.deleted) {
          e.preventDefault()
        }
      }}
      className="items-center flex"
    >
      <input type="hidden" name="postAuthorId" value={item.publishedById} />
      <button
        type="submit"
        name="_action"
        value={toggled ? 'removeLike' : 'addLike'}
        className={classNames(
          'inline-flex gap-1 items-center cursor-pointer group',
          toggled ? 'text-rose-600' : ''
        )}
        title={toggled ? 'Unlike' : 'Like'}
        onClick={(e) => e.stopPropagation()}
      >
        <HeartIcon
          title={toggled ? 'Unlike' : 'Like'}
          className={classNames(
            'w-6 h-6 group-hover:ring-8 group-hover:bg-rose-600/20 group-hover:ring-rose-600/20 rounded-full transition-all ease-in-out duration-300',
            toggled && 'fill-rose-600'
          )}
        />
      </button>
    </fetcher.Form>
  )
}

export function TipButton({ item }: { item: PostCardModel }) {
  const { setTipPost } = useTipPostModal()

  return (
    <CardAction
      item={item}
      action={$path('/api/post/:postId/like', { postId: item.id })}
    >
      <input type="hidden" name="postAuthorId" value={item.publishedById} />
      <button
        type="button"
        className={classNames(
          'inline-flex gap-1 items-center cursor-pointer group',
          item.wasTipped ? 'text-[#0ac18e]' : ''
        )}
        title="Tip"
        onClick={(e) => {
          e.stopPropagation()
          setTipPost({
            authorDisplayName: item.person.name || item.person.handle,
            postId: item.id,
            network: item.person.network as Network,
            bchAddress: item.person.bchAddress as string,
          })
        }}
      >
        <BitcoinIcon
          title="Tip"
          className={classNames(
            'w-6 h-6 flex items-center group-hover:ring-8 group-hover:bg-[#0ac18e]/20 group-hover:ring-[#0ac18e]/20 transition-all ease-in-out duration-300 rounded-full',
            item.wasTipped && 'fill-[#0ac18e]'
          )}
        />
      </button>
    </CardAction>
  )
}

export function BookmarkButton({
  item,
}: {
  item: PostCardModel & { wasBookmarked?: boolean }
}) {
  return (
    <CardAction
      item={item}
      action={$path('/api/post/:postId/like', { postId: item.id })}
    >
      <input type="hidden" name="postAuthorId" value={item.publishedById} />
      <button
        type="submit"
        name="_action"
        value={item.wasBookmarked ? 'removeLike' : 'addLike'}
        className={classNames(
          'inline-flex gap-1 items-center hover:text-rose-500 cursor-pointer',
          item.wasBookmarked ? 'text-rose-600' : ''
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <BookmarkIcon className="w-6 h-6" />
      </button>
    </CardAction>
  )
}

export function ShareButton({ item }: { item: PostCardModel }) {
  return (
    <CardAction
      item={item}
      action={$path('/api/post/:postId/like', { postId: item.id })}
    >
      <input type="hidden" name="postAuthorId" value={item.publishedById} />
      <button
        type="button"
        className={classNames(
          'inline-flex gap-1 items-center hover:text-rose-500 cursor-pointer'
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <ShareIcon className="w-6 h-6" />
      </button>
    </CardAction>
  )
}
