/* eslint-disable react/display-name */
import { Menu } from '@headlessui/react'
import { EllipsisHorizontalIcon } from '@heroicons/react/20/solid'
import {
  ArrowPathRoundedSquareIcon,
  ChartBarIcon,
  ChatBubbleLeftRightIcon,
  CodeBracketIcon,
  FlagIcon,
  HeartIcon,
  NoSymbolIcon,
  SpeakerXMarkIcon,
  TrashIcon,
  UserMinusIcon,
  UserPlusIcon,
} from '@heroicons/react/24/outline'
import {
  Fetcher,
  Link,
  useFetcher,
  useLocation,
  useNavigate,
  useRevalidator,
} from '@remix-run/react'
import { useQueryClient } from '@tanstack/react-query'
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
// import { HtmlPortalNode, OutPortal } from 'react-reverse-portal'
import { $path } from 'remix-routes'
import { useDebounce } from 'usehooks-ts'
import { Avatar } from '~/components/avatar'
import { useLayoutLoaderData } from '~/routes/_app/route'
import {
  PostActionType,
  usePostActionSubmit,
} from '~/routes/api.post.$postId.$authorId.action.$action'
import { Network } from '~/utils/bchUtils'
import { classNames } from '~/utils/classNames'
import { prettyPrintSats } from '~/utils/prettyPrintSats'
import { BitcoinIcon } from '../icons/BitcoinIcon'
import { useTipPostModal } from '../tip-modal'
import { UserPopover, useUserPopover } from '../user-popover'
import { useAuthGuardCheck } from '../utils/useAuthGuardCheck'
import { View as FileGridView } from './file-grid'
import Iframely from './iframely'
import { PostContentRenderer } from './post-content-renderer'
import { PostCardModel } from './types'

const PostContext = createContext<PostCardModel | null>(null)
const usePost = () => {
  const post = useContext(PostContext)
  if (!post) {
    throw new Error('this must be a child of a PostCard element')
  }

  return post
}
export function PostCard({
  item,
  children,
  footer,
  className,
}: {
  item: PostCardModel
  children?: React.ReactNode
  footer?: React.ReactNode
  className?: string
}) {
  const navigate = useNavigate()
  const location = useLocation()
  const handleClick: React.MouseEventHandler<HTMLDivElement> = (e) => {
    if (e.target instanceof HTMLAnchorElement) return

    //TODO:
    if (
      !item.person.handle ||
      !item.id ||
      item.deleted ||
      `/profile/${item.person.handle}/status/${item.id}` === location.pathname
    )
      return
    navigate(`/profile/${item.person.handle}/status/${item.id}`)
  }

  return (
    <PostContext.Provider value={item}>
      <div className={classNames(className, '')} onClick={handleClick}>
        <div
          className={classNames(
            'relative py-4 px-4',
            item.repostedBy ? 'pt-8' : ''
          )}
        >
          <div className="relative">
            {item.isThread ? (
              <span
                className="absolute top-8 left-5 -ml-px h-full w-0.5 bg-gray-200 dark:bg-gray-700"
                aria-hidden="true"
              />
            ) : null}
            <div className="relative flex items-start">
              <AvatarHeader item={item} />
              <div className="min-w-0 flex-1 relative">{children}</div>
            </div>
          </div>
        </div>
        {footer}
      </div>
    </PostContext.Provider>
  )
}

const AvatarHeader = function ({ item }: { item: PostCardModel }) {
  return (
    <div className="relative mr-2">
      <Avatar
        className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-400"
        src={item.avatarUrl}
        alt=""
      />
    </div>
  )
}

type PostCardMenuItem = {
  icon: React.JSXElementConstructor<any>
  content: React.ReactNode
  action: PostActionType
  className?: string
}

PostCard.ItemMenu = function () {
  const post = usePost()
  const layoutData = useLayoutLoaderData()

  const menuItems = React.useMemo<PostCardMenuItem[]>(() => {
    const isCurrentUser =
      !layoutData.anonymousView &&
      post.publishedById === layoutData.profile.id &&
      post.repostedBy !== layoutData.profile.id

    const currentUserItems: PostCardMenuItem[] =
      isCurrentUser && !post.repostedBy
        ? [
            {
              icon: TrashIcon,
              content: `Delete`,
              action: 'post:remove',
              className: 'text-red-500',
            },
          ]
        : []

    const baseItems: PostCardMenuItem[] = [
      { icon: CodeBracketIcon, content: `Embed Tweet`, action: 'embed' },
    ]

    if (!isCurrentUser) {
      baseItems.push({
        icon: FlagIcon,
        content: `Report @${post.person.handle}`,
        action: 'report',
      })
    }

    const loggedInItems: PostCardMenuItem[] = isCurrentUser
      ? []
      : [
          {
            icon: post.isFollowed ? UserMinusIcon : UserPlusIcon,
            content: `${post.isFollowed ? 'Unfollow' : 'Follow'} @${
              post.person.handle
            }`,
            action: post.isFollowed ? 'follow:remove' : 'follow:add',
          },
          // {
          //   icon: ClipboardDocumentListIcon,
          //   content: `Add/remove @${post.person.handle} from Lists`,
          //   action: 'list:add',
          // },
          {
            icon: SpeakerXMarkIcon,
            content: `${post.isMuted ? 'Unmute' : 'Mute'} @${
              post.person.handle
            }`,
            action: post.isMuted ? 'mute:remove' : 'mute:add',
          },
          {
            icon: NoSymbolIcon,
            content: `${post.isBlocked ? 'Unblock' : 'Block'} @${
              post.person.handle
            }`,
            action: post.isBlocked ? 'block:remove' : 'block:add',
          },
        ]

    return layoutData.anonymousView
      ? baseItems
      : Array.prototype.concat(currentUserItems, loggedInItems, baseItems)
  }, [post])

  const submitAction = usePostActionSubmit()

  return (
    <Menu>
      <Menu.Button
        onClick={(e: React.MouseEvent) => {
          e.stopPropagation()
        }}
      >
        <span className="hover:bg-hover-secondary hover:ring-4 hover:ring-hover-secondary ml-auto relative rounded-full text-primary-text cursor-pointer flex items-center">
          <EllipsisHorizontalIcon className="w-5 h-5" />
        </span>
      </Menu.Button>
      <Menu.Items
        className={classNames(
          'absolute bg-primary border right-0 rounded-lg overflow-hidden flex flex-col divide-y z-10',
          ''
        )}
      >
        {menuItems.map((item, i) => {
          return (
            <Menu.Item key={i}>
              {({ active }) => (
                <button
                  className={classNames(
                    `${active && 'bg-blue-500/20'}`,
                    item.className,
                    'w-full py-3 text-[15px] px-4 flex text-left gap-4 font-semibold text-primary-text'
                  )}
                  onClick={(e) => {
                    submitAction(post.id, post.publishedById, item.action)
                    e.stopPropagation()
                  }}
                >
                  <item.icon className="w-5 h-5" />
                  {item.content}
                </button>
              )}
            </Menu.Item>
          )
        })}
      </Menu.Items>
    </Menu>
  )
}

function UserPopoverLink<T extends React.ElementType>({
  id,
  children,
  as,
}: {
  as?: T
  id: string
  children: React.ReactNode
} & Omit<React.ComponentPropsWithoutRef<T>, keyof T>) {
  const [isHovering, setIsHovering] = useState(false)
  const isHoveringDebounced = useDebounce(isHovering, 500)
  const { setReferenceElement, setPopperElement, styles, attributes } =
    useUserPopover()
  const Component = as || 'div'

  return (
    <Component
      onMouseOver={() => setIsHovering(true)}
      onMouseOut={() => setIsHovering(false)}
      data-id={id}
      ref={isHoveringDebounced ? setReferenceElement : undefined}
    >
      {children}
      {isHoveringDebounced ? (
        <div
          ref={setPopperElement}
          style={styles.popper}
          {...attributes.popper}
          className={classNames(
            'z-40 bg-primary border dark:border-gray-700 p-4 rounded-xl drop-shadow-md',
            attributes.popper?.className
          )}
        >
          <UserPopover id={id} />
        </div>
      ) : null}
    </Component>
  )
}

PostCard.InlinePostHeader = function () {
  const item = usePost()

  return (
    <div className="text-[15px]">
      <UserPopoverLink id={item.publishedById} as={'span'}>
        <Link
          to={$path('/profile/:username', {
            username: item.person.handle,
          })}
          className="font-bold text-primary-text hover:underline"
        >
          {item.person.name}
        </Link>
      </UserPopoverLink>{' '}
      <UserPopoverLink id={item.publishedById} as={'span'}>
        <Link
          className="text-sm text-secondary-text"
          to={$path('/profile/:username', {
            username: item.person.handle,
          })}
        >
          @{item.person.handle}
        </Link>
      </UserPopoverLink>{' '}
      <span className="before:content-['\2022'] text-secondary-text" />{' '}
      <span className="text-sm text-secondary-text">{item.date}</span>
    </div>
  )
}

PostCard.Content = function (
  props: React.ComponentProps<'div'> & { showFullLength?: boolean }
) {
  const item = usePost()
  const { setReferenceElement, setPopperElement, styles, attributes } =
    useUserPopover()

  const [hoveringMentionElem, setHoveringMentionElem] =
    useState<HTMLElement | null>(null)
  const hoveringMentionElemDebounced = useDebounce(hoveringMentionElem, 500)
  useEffect(() => {
    setReferenceElement(hoveringMentionElemDebounced)
  }, [hoveringMentionElemDebounced])

  const hoveringId = useMemo(() => {
    return hoveringMentionElemDebounced?.getAttribute('data-id')
  }, [hoveringMentionElemDebounced])

  return (
    <div>
      {item.monetization?.title ? (
        <h1 className="my-2 text-xl text-primary-text font-semibold prose">
          {item.monetization.title}
        </h1>
      ) : null}
      <div
        className={classNames(
          props.className,
          'my-2 text-[15px] text-primary-text prose flex flex-col gap-2 break-word',
          '[&_p]:m-0',
          '[&_img]:aspect-[5/4] [&_img]:object-cover [&_img]:m-0 [&_img]:rounded-lg [&_img]:overflow-hidden [&_img]:relative [&_img]:w-full [&_img]:h-full'
        )}
        onMouseOver={(e) => {
          const target = e.target instanceof HTMLElement ? e.target : null
          if (target?.getAttribute('data-type') === 'mention') {
            setHoveringMentionElem(target)
          }
        }}
        onMouseOut={(e) => {
          const target = e.target instanceof HTMLElement ? e.target : null
          if (target?.getAttribute('data-type') === 'mention') {
            setHoveringMentionElem(null)
          }
        }}
      >
        <PostContentRenderer
          content={item.content}
          showFullLength={props.showFullLength}
        />
      </div>
      {hoveringId ? (
        <div
          ref={setPopperElement}
          style={styles.popper}
          {...attributes.popper}
          className={classNames(
            'z-40 bg-primary border dark:border-gray-700 p-4 rounded-xl drop-shadow-md',
            attributes.popper?.className
          )}
        >
          <UserPopover id={hoveringId} />
        </div>
      ) : null}
    </div>
  )
}

PostCard.MediaItems = function ({
  showFullLength,
  isScrolling,
}: // portalNode,
{
  showFullLength?: boolean
  isScrolling?: boolean
  // portalNode?: HtmlPortalNode
}) {
  const item = usePost()

  return (
    <>
      {' '}
      {!!item.mediaUrls.length ? (
        <div className="overflow-hidden relative">
          <FileGridView urls={item.mediaUrls} showFullLength={showFullLength} />
        </div>
      ) : item.embed ? (
        // portalNode ? (
        //   <OutPortal node={portalNode} />
        // ) : (
        <Iframely
          url={item.embed}
          isScrolling={isScrolling}
          allowFullHeight={showFullLength}
        />
      ) : // )
      null}
    </>
  )
}

PostCard.Actions = function () {
  const item = usePost()

  return (
    <div className="mt-2 sm:mt-3 text-base text-gray-400 flex flex-row gap-8">
      <CommentsButton item={item} />
      <RepostButton item={item} />
      <LikeButton item={item} />
      {item.person.bchAddress && item.person.network ? (
        <TipButton item={item} />
      ) : null}
      {/* <ViewCounts item={item} /> */}
    </div>
  )
}

function useInvalidateFeedPage(fetcher: Fetcher, postId: string) {
  const queryClient = useQueryClient()
  const revalidator = useRevalidator()
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

function CardAction({
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
      className="flex items-center"
      method="POST"
      action={action}
      preventScrollReset={true}
    >
      {children}
    </fetcher.Form>
  )
}

function CommentsButton({ item }: { item: PostCardModel }) {
  const checkAuth = useAuthGuardCheck()

  return (
    <Link
      to={{ search: `?modal=reply&postId=${item.id}` }}
      state={{ replyToPost: item }}
      preventScrollReset={true}
      replace={true}
      onClick={(e) => {
        e.stopPropagation()
        checkAuth(e)
      }}
      className="inline-flex gap-1 items-center cursor-pointer group"
      title="Comment"
    >
      <ChatBubbleLeftRightIcon
        title="Comment"
        className="w-5 h-5 flex items-center group-hover:ring-8 group-hover:bg-blue-600/20 group-hover:ring-blue-600/20 transition-all ease-in-out duration-300 rounded-full"
      />
      {item.replyCount && <span>{item.replyCount}</span>}
    </Link>
  )
}

function RepostButton({ item }: { item: PostCardModel }) {
  const fetcher = useFetcher()
  const toggled = item.wasReposted
  const count = item.repostCount
  const action = toggled ? 'repost:remove' : 'repost:add'
  const checkAuth = useAuthGuardCheck()

  return (
    <fetcher.Form
      className="flex items-center"
      method="POST"
      action={$path('/api/post/:postId/:authorId/action/:action', {
        postId: item.id,
        authorId: item.publishedById,
        action,
      })}
      preventScrollReset={true}
    >
      <input type="hidden" name="postAuthorId" value={item.publishedById} />
      <button
        type="submit"
        onClick={(e) => {
          e.stopPropagation()
          checkAuth(e)
        }}
        className={classNames(
          'inline-flex gap-1 items-center cursor-pointer group',
          toggled ? 'text-emerald-600' : ''
        )}
        title={toggled ? 'Unrepost' : 'Repost'}
      >
        <ArrowPathRoundedSquareIcon
          title={toggled ? 'Unrepost' : 'Repost'}
          className="w-5 h-5 flex items-center group-hover:ring-8 group-hover:bg-emerald-600/20 group-hover:ring-emerald-600/20 transition-all ease-in-out duration-300 rounded-full"
        />
        <span>{count}</span>
      </button>
    </fetcher.Form>
  )
}

function LikeButton({ item }: { item: PostCardModel }) {
  const fetcher = useFetcher()
  const toggled = item.wasLiked
  const count = item.likeCount
  const action = toggled ? 'like:remove' : 'like:add'
  const checkAuth = useAuthGuardCheck()

  return (
    <fetcher.Form
      className="flex items-center"
      method="POST"
      action={$path('/api/post/:postId/:authorId/action/:action', {
        postId: item.id,
        authorId: item.publishedById,
        action,
      })}
      preventScrollReset={true}
    >
      <button
        type="submit"
        className={classNames(
          'inline-flex gap-1 items-center cursor-pointer group',
          toggled ? 'text-rose-600' : ''
        )}
        title={toggled ? 'Unlike' : 'Like'}
        onClick={(e) => {
          e.stopPropagation()
          checkAuth(e)
        }}
      >
        <HeartIcon
          title={toggled ? 'Unlike' : 'Like'}
          className={classNames(
            'w-5 h-5 flex items-center group-hover:ring-8 group-hover:bg-rose-600/20 group-hover:ring-rose-600/20 transition-all ease-in-out duration-300 rounded-full',
            toggled && 'fill-rose-600'
          )}
        />
        <span>{count}</span>
      </button>
    </fetcher.Form>
  )
}

const TipButton = ({ item }: { item: PostCardModel }) => {
  const [tipAmountStr, denomination] = useMemo(() => {
    return prettyPrintSats(item.tipAmount)
  }, [item.tipAmount])
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
          'w-5 h-5 flex items-center group-hover:ring-8 group-hover:bg-[#0ac18e]/20 group-hover:ring-[#0ac18e]/20 transition-all ease-in-out duration-300 rounded-full',
          item.wasTipped && 'fill-[#0ac18e]'
        )}
      />
      {item.tipAmount && (
        <span className="text-sm">
          {tipAmountStr}
          <small className="text-xs">{denomination}</small>
        </span>
      )}
    </button>
  )
}

function ViewCounts({ item }: { item: PostCardModel }) {
  return (
    <span
      className="inline-flex gap-1 items-center"
      onClick={(e) => e.stopPropagation()}
    >
      <ChartBarIcon className="w-5 h-5" />
      {item.viewCount && <span>{item.viewCount}</span>}
    </span>
  )
}

function FollowButton({ item }: { item: PostCardModel }, active: boolean) {
  return (
    <Menu.Item>
      {({ active }) => (
        <>
          {console.log('active', active)}
          <input type="hidden" name="profileId" value={item.publishedById} />
          <button
            type="submit"
            name="_action"
            value={item.isCurrentUserFollowing ? 'unfollow' : 'follow'}
            className={classNames(
              `${active && 'bg-blue-500/20'}`,
              'w-full py-3 text-[15px] px-4 flex text-left gap-4 font-semibold text-primary-text'
            )}
            onClick={(e) => {
              e.stopPropagation()
            }}
          >
            {item.isCurrentUserFollowing ? (
              <UserMinusIcon className="w-5 h-5" title="Unfollow" />
            ) : (
              <UserPlusIcon className="w-5 h-5" title="Follow" />
            )}
            {item.isCurrentUserFollowing ? 'Unfollow' : 'Follow'} @
            {item.person.handle}
          </button>
        </>
      )}
    </Menu.Item>
  )
}
