/* eslint-disable react/display-name */
// import { HtmlPortalNode, OutPortal } from 'react-reverse-portal'
import { Avatar } from '~/components/avatar'
import { PostCardModel } from '~/components/post/types'

export function PostCardAvatar({ item }: { item: PostCardModel }) {
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
