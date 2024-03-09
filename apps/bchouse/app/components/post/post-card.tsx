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
import { Link, useLocation, useNavigate } from '@remix-run/react'
import { useQueryClient } from '@tanstack/react-query'
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { AppRouterInputs, trpc } from '~/utils/trpc'
// import { HtmlPortalNode, OutPortal } from 'react-reverse-portal'
import { Network, logger, prettyPrintSats } from '@bchouse/utils'
import { $path } from 'remix-routes'
import { useDebounce } from 'usehooks-ts'
import { Avatar } from '~/components/avatar'
import { useCurrentUser } from '~/components/context/current-user-context'
import { classNames } from '~/utils/classNames'
import { BitcoinIcon } from '../icons/BitcoinIcon'
import { useTipPostModal } from '../tip-modal'
import { UserPopover, useUserPopover } from '../user-popover'
import { classnames } from '../utils/classnames'
import { useAuthGuardCheck } from '../utils/useAuthGuardCheck'
import { View as FileGridView } from './file-grid'
import Iframely from './iframely'
import { PostContentRenderer } from './post-content-renderer'
import { PostCardModel } from './types'

type PostActionType = AppRouterInputs['post']['postAction']['action']

const PostContext = createContext<PostCardModel | null>(null)
const usePost = () => {
  const post = useContext(PostContext)
  if (!post) {
    throw new Error('this must be a child of a PostCard element')
  }

  return post
}

export const PostProvider = ({
  item,
  children,
}: {
  item: PostCardModel
  children: React.ReactNode
}) => {
  return <PostContext.Provider value={item}>{children}</PostContext.Provider>
}

export function PostCard({
  item: post,
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
  const { data } = trpc.post.getPost.useQuery(
    {
      postId: post.id,
    },
    {
      //TODO: stagger stale time, not to fetch all at same time,
      //TODO: only set while in view
      staleTime: 5 * 60 * 1000,
      gcTime: Infinity,
    }
  )

  //TODO: data should always exist due to feed queries, otherwise should render skeleton
  const item = data!
  if (!data) {
    logger.error('Post data undefined')
    return null
  }

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

type PostCardMenuItem =
  | {
      type: 'button'
      key: string
      icon: React.JSXElementConstructor<any>
      content: React.ReactNode
      action: PostActionType
      className?: string
    }
  | {
      type: 'toggle'
      key: string
      value: boolean
      props: (toggled: boolean) => {
        icon: React.JSXElementConstructor<any>
        content: React.ReactNode
        action: PostActionType
        className?: string
      }
    }

PostCard.ItemMenu = function () {
  const post = usePost()
  const currentUser = useCurrentUser()

  const menuItems = React.useMemo<PostCardMenuItem[]>(() => {
    const isCurrentUser =
      !currentUser.isAnonymous &&
      post.publishedById === currentUser.id &&
      post.repostedBy !== currentUser.id

    const currentUserItems: PostCardMenuItem[] =
      isCurrentUser && !post.repostedBy
        ? [
            {
              icon: TrashIcon,
              key: 'delete',
              type: 'button',
              content: `Delete`,
              action: 'post:remove',
              className: 'text-red-500',
            },
          ]
        : []

    const baseItems: PostCardMenuItem[] = [
      {
        type: 'button',
        key: 'embed',
        icon: CodeBracketIcon,
        content: `Embed Tweet`,
        action: 'embed',
      },
    ]

    if (!isCurrentUser) {
      baseItems.push({
        type: 'button',
        key: 'report',
        icon: FlagIcon,
        content: `Report @${post.person.handle}`,
        action: 'report',
      })
    }

    const loggedInItems: PostCardMenuItem[] = isCurrentUser
      ? []
      : [
          {
            type: 'toggle',
            key: 'follow:' + post.publishedById,
            value: !!post.isFollowed,
            props: (isFollowed) => ({
              icon: isFollowed ? UserMinusIcon : UserPlusIcon,
              content: `${isFollowed ? 'Unfollow' : 'Follow'} @${
                post.person.handle
              }`,
              action: isFollowed ? 'follow:remove' : 'follow:add',
            }),
          },
          // {
          //   icon: ClipboardDocumentListIcon,
          //   content: `Add/remove @${post.person.handle} from Lists`,
          //   action: 'list:add',
          // },
          {
            type: 'toggle',
            key: 'mute',
            value: !!post.isMuted,
            props: (isMuted) => ({
              icon: SpeakerXMarkIcon,
              content: `${isMuted ? 'Unmute' : 'Mute'} @${post.person.handle}`,
              action: isMuted ? 'mute:remove' : 'mute:add',
            }),
          },
          {
            type: 'toggle',
            key: 'block',
            value: !!post.isBlocked,
            props: (isBlocked) => ({
              icon: NoSymbolIcon,
              content: `${isBlocked ? 'Unblock' : 'Block'} @${
                post.person.handle
              }`,
              action: isBlocked ? 'block:remove' : 'block:add',
            }),
          },
        ]

    return currentUser.isAnonymous
      ? baseItems
      : Array.prototype.concat(currentUserItems, loggedInItems, baseItems)
  }, [post])

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
              {({ active, close }) => (
                <div>
                  <MenuAction
                    active={active}
                    menuItem={item}
                    post={post}
                    close={close}
                  />
                </div>
              )}
            </Menu.Item>
          )
        })}
      </Menu.Items>
    </Menu>
  )
}

const MenuAction = React.forwardRef<
  HTMLButtonElement,
  {
    active: boolean
    menuItem: PostCardMenuItem
    post: PostCardModel
    close: () => void
  }
>(({ active, menuItem, post, close }, ref) => {
  // const props = useMemo(() => {
  //   if (menuItem.type === 'button') {
  //     return menuItem
  //   }

  //   const currentProps = menuItem.props(menuItem.value)
  //   if (fetcher.state === 'idle') {
  //     return currentProps
  //   }

  //   //Return optimistic props
  //   return fetcher.formAction?.indexOf(currentProps.action) !== -1
  //     ? menuItem.props(!menuItem.value)
  //     : currentProps
  // }, [menuItem, fetcher.state])

  //TODO: optimistic update
  const queryClient = useQueryClient()
  const [props, setProps] = useState(() =>
    menuItem.type === 'button' ? menuItem : menuItem.props(menuItem.value)
  )
  const mutation = trpc.post.postAction.useMutation({
    onMutate(variables) {},
    onSuccess(variables) {},
    onError(variables) {},
    onSettled(variables) {},
  })

  return (
    <button
      ref={ref}
      className={classNames(
        `${active && 'bg-blue-500/20'}`,
        props.className,
        'w-full py-3 text-[15px] px-4 flex text-left gap-4 font-semibold text-primary-text'
      )}
      onClick={(e) => {
        e.stopPropagation()

        mutation.mutate({
          action: props.action,
          authorId: post.publishedById,
          postId: post.id,
        })

        close()
      }}
    >
      <props.icon className="w-5 h-5" />
      {props.content}
    </button>
  )
})

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
          <FileGridView
            urls={item.mediaUrls}
            showFullLength={showFullLength}
            post={item}
          />
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

PostCard.Actions = function ({ className }: { className?: string }) {
  const item = usePost()

  return (
    <div
      className={classnames(
        'mt-2 sm:mt-3 text-base text-gray-400 flex flex-row gap-8',
        className
      )}
    >
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
  const checkAuth = useAuthGuardCheck()
  //TODO: optimistic update
  const queryClient = useQueryClient()
  const toggled = item.wasReposted
  const count = item.repostCount
  const action = toggled ? 'like:remove' : 'like:add'
  const utils = trpc.useUtils()
  const mutation = trpc.post.postAction.useMutation({
    onMutate(variables) {
      const isAddRepost = !toggled

      utils.post.getPost.setData(
        { postId: item.id },
        {
          ...item,
          wasReposted: isAddRepost,
          repostCount: Math.max(item.repostCount + (isAddRepost ? 1 : -1), 0),
        }
      )
    },
    onSuccess(variables) {
      //TODO: update that specific post
      // invalidateFeed(queryClient, item.id)
    },
    onError(variables) {},
    onSettled(variables) {},
  })

  return (
    <form
      className="flex items-center"
      method="POST"
      onSubmit={(e) => {
        e.preventDefault()

        checkAuth(e)

        mutation.mutate({
          postId: item.id,
          authorId: item.publishedById,
          action,
        })
      }}
      onClick={(e) => e.stopPropagation()}
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
          className="w-5 h-5 flex items-center group-hover:ring-8 group-hover:bg-emerald-600/20 group-hover:ring-emerald-600/20 transition-all ease-in-out duration-300 rounded-full"
        />
        <span>{count}</span>
      </button>
    </form>
  )
}

function LikeButton({ item }: { item: PostCardModel }) {
  const checkAuth = useAuthGuardCheck()

  //TODO: optimistic update
  const queryClient = useQueryClient()
  const toggled = item.wasLiked
  const count = item.likeCount
  const action = toggled ? 'like:remove' : 'like:add'
  const utils = trpc.useUtils()
  const mutation = trpc.post.postAction.useMutation({
    onMutate(variables) {
      const isAddLike = !toggled
      utils.post.getPost.setData(
        { postId: item.id },
        {
          ...item,
          wasLiked: isAddLike,
          likeCount: Math.max(item.likeCount + (isAddLike ? 1 : -1), 0),
        }
      )
    },
    onSuccess(variables) {
      //TODO: update that specific post
      // invalidateFeed(queryClient, item.id)
    },
    onError(variables) {},
    onSettled(variables) {},
  })

  return (
    <form
      className="flex items-center"
      method="POST"
      onSubmit={(e) => {
        e.preventDefault()

        checkAuth(e)

        mutation.mutate({
          postId: item.id,
          authorId: item.publishedById,
          action,
        })
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <button
        type="submit"
        className={classNames(
          'inline-flex gap-1 items-center cursor-pointer group',
          toggled ? 'text-rose-600' : ''
        )}
        title={toggled ? 'Unlike' : 'Like'}
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
    </form>
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
