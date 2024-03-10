import { PostCard } from '~/components/post/card'
import { PostProvider } from '~/components/post/card/context'
import { PostCardModel } from '../../types'

export function PostFooter({
  post,
  className,
}: {
  post: PostCardModel
  className?: string
}) {
  return (
    <PostProvider item={post}>
      <PostCard.Actions className={className} />
    </PostProvider>
  )
}
