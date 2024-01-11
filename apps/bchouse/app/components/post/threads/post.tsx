import { Link } from '@remix-run/react'
import React from 'react'
import { $path } from 'remix-routes'
import { Actions } from '../actions'
import { PostCard } from '../post-card'
import { RepostedBy } from '../reposted-by'
import { PostCardModel } from '../types'

export const Post = React.memo(
  ({
    post,
    currentUser,
    mainPostId,
    actionButton,
  }: {
    mainPostId: string
    post: PostCardModel
    currentUser?: {
      username: string
      avatarUrl: string | undefined
    }
    actionButton?: React.ReactNode
  }) => {
    return post.id !== mainPostId ? (
      <React.Fragment key={post.id}>
        {!post.deleted ? (
          <PostCard
            key={post.key}
            item={post}
            className="hover:bg-hover transition-all ease-in-out duration-300 cursor-pointer border-gray-100 dark:border-gray-600"
          >
            <RepostedBy currentUser={currentUser} item={post} />
            <div className="flex">
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
        ) : (
          <PostCard item={post} key={post.key}>
            <div className="flex">
              <div className="ml-auto">
                <PostCard.ItemMenu />
              </div>
            </div>
            <div className="flex bg-gray items-center justify-center">
              <PostCard.Content className="text-[18px]" showFullLength />
            </div>
          </PostCard>
        )}
      </React.Fragment>
    ) : (
      <React.Fragment key={post.id}>
        {/* Activity feed*/}
        <div id="currentPost">
          {!post.deleted ? (
            <PostCard
              key={post.key}
              item={post}
              footer={<Actions item={post} />}
            >
              <div className="flex gap-2 items-center">
                <Link
                  to={$path('/profile/:username', {
                    username: post.person.handle,
                  })}
                  className="text-[15px] font-bold text-primary-text hover:underline"
                >
                  {post.person.name}{' '}
                </Link>
                {actionButton}
                <div className="ml-auto">
                  <PostCard.ItemMenu />
                </div>
              </div>
              <div className="-mt-1">
                <Link
                  className="text-sm text-secondary-text"
                  to={$path('/profile/:username', {
                    username: post.person.handle,
                  })}
                >
                  @{post.person.handle}
                </Link>
              </div>
              <PostCard.Content className="text-[18px]" showFullLength />
              <PostCard.MediaItems showFullLength />
            </PostCard>
          ) : (
            <PostCard
              item={post}
              key={post.key}
              footer={<Actions item={post} />}
            >
              <div className="flex gap-2 items-center"></div>
              <div className="flex bg-gray-200 dark:bg-gray-700 shadow rounded-lg items-center justify-center mx-6 py-7">
                <PostCard.Content
                  className="text-sm text-primary-text"
                  showFullLength
                />
              </div>
            </PostCard>
          )}
        </div>
      </React.Fragment>
    )
  }
)
