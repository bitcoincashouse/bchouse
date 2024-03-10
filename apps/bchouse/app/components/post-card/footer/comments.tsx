/* eslint-disable react/display-name */
import { ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline'
import { Link } from '@remix-run/react'
// import { HtmlPortalNode, OutPortal } from 'react-reverse-portal'
import { PostCardModel } from '~/components/post/types'
import { useAuthGuardCheck } from '~/components/utils/useAuthGuardCheck'

export function CommentsButton({ item }: { item: PostCardModel }) {
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
