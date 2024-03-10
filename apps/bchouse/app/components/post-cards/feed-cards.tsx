import { Link } from '@remix-run/react'
import { $path } from 'remix-routes'
import { useCurrentUser } from '~/components/context/current-user-context'
import { Avatar } from '../avatar'
import { PostCard } from '../post-card'
import { PostCardModel } from '../post/types'

export function FeedCard({
  post,
  isScrolling,
}: {
  post: PostCardModel
  isScrolling: boolean
}) {
  const currentUser = useCurrentUser()

  return (
    <>
      <PostCard
        key={post.key}
        item={post}
        className="hover:bg-hover transition-all ease-in-out duration-300 cursor-pointer border-b border-gray-100 dark:border-gray-600"
        footer={
          post.isThread ? (
            <div className="relative flex items-center p-4 gap-3 text-blue-400 font-light hover:bg-gray-100/80 dark:hover:bg-gray-800/10 cursor-pointer">
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
          {!post.repostedBy && post.parentPost ? (
            <div>
              <div className="-mt-1 text-sm text-secondary-text">
                <span className="text-[15px]">
                  Replying to{' '}
                  <Link
                    className="link hover:underline"
                    to={$path('/profile/:username', {
                      username: post.parentPost.handle,
                    })}
                    onClick={(e) => {
                      e.stopPropagation()
                    }}
                  >
                    @{post.parentPost.handle}
                  </Link>
                </span>
              </div>
              <div className="flex">
                <PostCard.InlinePostHeader />
              </div>
            </div>
          ) : (
            <PostCard.InlinePostHeader />
          )}

          <div className="ml-auto">
            <PostCard.ItemMenu />
          </div>
        </div>

        <PostCard.Content className="text-[15px]" />
        <PostCard.MediaItems
          isScrolling={isScrolling}
          // portalNode={mediaPortal}
        />

        {post.monetization ? (
          <button className="w-full border-2 mt-4 border-primary-btn-300 py-2 text-[15px] font-semibold rounded-full flex items-center justify-center text-primary-btn-400">
            View campaign
          </button>
        ) : null}
        <PostCard.Actions />
      </PostCard>
    </>
  )
}
