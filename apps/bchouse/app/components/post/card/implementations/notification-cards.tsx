import { Link } from '@remix-run/react'
import { $path } from 'remix-routes'
import { PostCard } from '~/components/post/card'
import { PostProvider } from '~/components/post/card/context'
import { useLoggedInUser } from '../../../context/current-user-context'
import { PostCardModel } from '../../types'

export function NotificationCard({ post }: { post: PostCardModel }) {
  return (
    <div>
      <PostProvider item={post}>
        <div className="w-full">
          <PostCard.Content className="text-gray-400" />
        </div>
      </PostProvider>
    </div>
  )
}

export function ReplyCard({ post }: { post: PostCardModel }) {
  const currentUser = useLoggedInUser()

  return (
    <PostCard item={post} className="w-full">
      <div>
        <div className="flex">
          <PostCard.InlinePostHeader />
          <div className="ml-auto">
            <PostCard.ItemMenu />
          </div>
        </div>
        <div className="-mt-1 text-sm text-secondary-text">
          <span className="text-[15px]">
            Replying to{' '}
            <Link
              className="link hover:underline"
              to={$path('/profile/:username', {
                username: currentUser.username,
              })}
            >
              @{currentUser.username}
            </Link>
          </span>
        </div>
      </div>
      <PostCard.Content />
      <PostCard.MediaItems />
      <PostCard.Actions />
    </PostCard>
  )
}

export function MentionCard({ post }: { post: PostCardModel }) {
  return (
    <PostCard item={post} className="w-full">
      <div>
        <div className="flex">
          <PostCard.InlinePostHeader />
          <div className="ml-auto">
            <PostCard.ItemMenu />
          </div>
        </div>
        <div className="-mt-1 text-sm text-secondary-text">
          <span className="text-[15px]">Mentioned you</span>
        </div>
      </div>
      <PostCard.Content />
      <PostCard.MediaItems />
      <PostCard.Actions />
    </PostCard>
  )
}
