import { Menu } from '@headlessui/react'
import { EllipsisHorizontalIcon } from '@heroicons/react/20/solid'
import {
  CodeBracketIcon,
  FlagIcon,
  NoSymbolIcon,
  SpeakerXMarkIcon,
  TrashIcon,
  UserMinusIcon,
  UserPlusIcon,
} from '@heroicons/react/24/outline'
import { useQueryClient } from '@tanstack/react-query'
import React, { useState } from 'react'
import { useCurrentUser } from '~/components/context/current-user-context'
import { PostCardModel } from '~/components/post/types'
import { classNames } from '~/utils/classNames'
import { AppRouterInputs, trpc } from '~/utils/trpc'
import { usePost } from '../context'

type PostActionType = AppRouterInputs['post']['postAction']['action']

export type PostCardMenuItem =
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

export function PostCardMenu() {
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
