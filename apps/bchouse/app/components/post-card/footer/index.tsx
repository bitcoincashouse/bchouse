import { classnames } from '~/components/utils/classnames'
import { usePost } from '../context'
import { CommentsButton } from './comments'
import { LikeButton } from './like'
import { RepostButton } from './repost'
import { TipButton } from './tip'

export function PostCardFooter({ className }: { className?: string }) {
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
      {item.person.bchAddress ? <TipButton item={item} /> : null}
      {/* <ViewCounts item={item} /> */}
    </div>
  )
}
