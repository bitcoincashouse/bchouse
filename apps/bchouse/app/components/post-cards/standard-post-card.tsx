import { useCurrentUser } from '~/components/context/current-user-context'
import { Avatar } from '../avatar'
import { PostCard } from '../post-card'
import { PostCardModel } from '../post/types'

export function StandardPostCard({ post }: { post: PostCardModel }) {
  const currentUser = useCurrentUser()

  return (
    <PostCard
      key={post.key}
      item={post}
      className="hover:bg-hover cursor-pointer border-b border-gray-100 dark:border-gray-600"
      footer={
        post.isThread ? (
          <div className="relative flex items-center p-4 gap-3 text-blue-400 font-light hover:bg-gray-100/80 dark:hover:bg-hover/10 cursor-pointer">
            <div className="basis-[40px]">
              <Avatar
                className="flex m-auto h-8 w-8 items-center justify-center rounded-full bg-gray-400"
                src={post.avatarUrl}
                alt=""
              />
            </div>
            <div className="">
              <span>Show this thread</span>
            </div>
          </div>
        ) : null
      }
    >
      <div className="flex">
        <PostCard.RepostedBy currentUser={currentUser} item={post} />
        <PostCard.InlinePostHeader />
        <div className="ml-auto">
          <PostCard.ItemMenu />
        </div>
      </div>

      <PostCard.Content className="text-[15px]" />
      <PostCard.MediaItems />

      {post.monetization || post.campaignId ? (
        <button className="w-full border-2 mt-4 border-primary-btn-300 py-2 text-[15px] font-semibold rounded-full flex items-center justify-center text-primary-btn-400">
          View campaign
        </button>
      ) : null}
      <PostCard.Actions />
    </PostCard>
  )
}
