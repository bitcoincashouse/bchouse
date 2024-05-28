import { Network, pluralize, prettyPrintSats } from '@bchouse/utils'
import {
  ArrowPathRoundedSquareIcon,
  BookmarkIcon,
  ChatBubbleLeftRightIcon,
  HeartIcon,
  ShareIcon,
} from '@heroicons/react/24/outline'
import { Link } from '@remix-run/react'
import { useQueryClient } from '@tanstack/react-query'
import { useMemo } from 'react'
import { $useActionMutation, $useUtils } from 'remix-query'
import { useCurrentUser } from '../../../../context/current-user-context'
import { BitcoinIcon } from '../../../../icons/BitcoinIcon'
import { useTipPostModal } from '../../../../tip-modal'
import { classNames } from '../../../../utils'
import { classnames } from '../../../../utils/classnames'
import { useAuthGuardCheck } from '../../../../utils/useAuthGuardCheck'
import { PostCardModel } from '../../../types'
import { usePost } from '../../context'

export function Actions() {
  const item = usePost()

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

export function CommentsButton({ item }: { item: PostCardModel }) {
  const checkAuth = useAuthGuardCheck()

  return (
    <Link
      to={{ search: `?modal=reply&postId=${item.id}` }}
      state={{ replyToPost: item }}
      preventScrollReset={true}
      replace={true}
      onClick={(e) => {
        checkAuth(e)

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

// function invalidateFeed(queryClient: QueryClient, postId: string) {
//   //TODO: invalidate the feed we're on whether home, profile (username + index/replies/likes/media)
//   queryClient.invalidateQueries({
//     queryKey: ['feed'],
//     refetchPage: (page: { posts: { id: string }[] }, i, all) => {
//       return page.posts.some((post) => post.id === postId)
//     },
//   })
// }

export function RepostButton({ item }: { item: PostCardModel }) {
  const checkAuth = useAuthGuardCheck()

  //TODO: optimistic update
  const queryClient = useQueryClient()
  const toggled = item.wasReposted
  const action = toggled ? 'repost:remove' : 'repost:add'
  const utils = $useUtils()
  const currentUser = useCurrentUser()
  const mutation = $useActionMutation('/api/post/action', {
    onMutate(variables) {
      const isAddRepost = !toggled

      utils.setData(
        '/api/post/get/:postId',
        { postId: item.id },
        {
          ...item,
          wasReposted: isAddRepost,
          repostCount: Math.max(item.repostCount + (isAddRepost ? 1 : -1), 0),
        }
      )
    },
    onSuccess(variables) {
      //TODO: invalidate single post
      // invalidateFeed(queryClient, item.id)
    },
    onError(variables) {},
    onSettled(variables) {},
  })

  return (
    <form
      method="POST"
      onSubmit={(e) => {
        e.preventDefault()

        checkAuth(e)
        if (item.deleted) {
          return
        }

        mutation.mutate({
          postId: item.id,
          authorId: item.publishedById,
          action,
        })
      }}
      onClick={(e) => e.stopPropagation()}
      className="items-center flex"
    >
      <button
        type="submit"
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
    </form>
  )
}

export function LikeButton({ item }: { item: PostCardModel }) {
  const checkAuth = useAuthGuardCheck()

  //TODO: optimistic update
  const queryClient = useQueryClient()
  const toggled = item.wasLiked
  const action = toggled ? 'like:remove' : 'like:add'
  const utils = $useUtils()
  const mutation = $useActionMutation('/api/post/action', {
    onMutate(variables) {
      const isAddLike = !toggled
      utils.setData(
        '/api/post/get/:postId',
        { postId: item.id },
        {
          ...item,
          wasLiked: isAddLike,
          likeCount: Math.max(item.likeCount + (isAddLike ? 1 : -1), 0),
        }
      )
    },
    onSuccess(variables) {
      //TODO: invalidate single post
      // invalidateFeed(queryClient, item.id)
    },
    onError(variables) {},
    onSettled(variables) {},
  })

  return (
    <form
      method="POST"
      onSubmit={(e) => {
        e.preventDefault()

        checkAuth(e)
        if (item.deleted) {
          return
        }

        mutation.mutate({
          postId: item.id,
          authorId: item.publishedById,
          action,
        })
      }}
      onClick={(e) => e.stopPropagation()}
      className="items-center flex"
    >
      <input type="hidden" name="postAuthorId" value={item.publishedById} />
      <button
        type="submit"
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
    </form>
  )
}

export function TipButton({ item }: { item: PostCardModel }) {
  const { setTipPost } = useTipPostModal()

  return (
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
  )
}

export function BookmarkButton({
  item,
}: {
  item: PostCardModel & { wasBookmarked?: boolean }
}) {
  return (
    <button
      className={classNames(
        'inline-flex gap-1 items-center hover:text-rose-500 cursor-pointer',
        item.wasBookmarked ? 'text-rose-600' : ''
      )}
      onClick={(e) => e.stopPropagation()}
    >
      <BookmarkIcon className="w-6 h-6" />
    </button>
  )
}

export function ShareButton({ item }: { item: PostCardModel }) {
  return (
    <button
      type="button"
      className={classNames(
        'inline-flex gap-1 items-center hover:text-rose-500 cursor-pointer'
      )}
      onClick={(e) => e.stopPropagation()}
    >
      <ShareIcon className="w-6 h-6" />
    </button>
  )
}
