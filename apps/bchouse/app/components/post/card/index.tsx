/* eslint-disable react/display-name */
import React from 'react'
import { classNames } from '~/utils/classNames'
import { PostCardModel } from '../types'
import { PostCardAvatar } from './avatar'
import { PostCardContent } from './content'
import { PostContext } from './context'
import { PostCardFooter } from './footer'
import { PostCardHeader } from './header'
import { PostCardMedia } from './media'
import { PostCardMenu } from './menu'
import { RepostedBy } from './reposted-by'
import { useOptimisticPost } from './useOptimisticPost'
import { usePostClickHandler } from './usePostClickHandler'

export function PostCard({
  item: rawPost,
  children,
  footer,
  className,
}: {
  item: PostCardModel
  children?: React.ReactNode
  footer?: React.ReactNode
  className?: string
}) {
  const post = useOptimisticPost(rawPost)
  const handleClick = usePostClickHandler(post)

  return (
    <PostContext.Provider value={post}>
      <div className={classNames(className, '')} onClick={handleClick}>
        <div
          className={classNames(
            'relative py-4 px-4',
            post.repostedBy ? 'pt-8' : ''
          )}
        >
          <div className="relative">
            {post.isThread ? (
              <span
                className="absolute top-8 left-5 -ml-px h-full w-0.5 bg-gray-200 dark:bg-gray-700"
                aria-hidden="true"
              />
            ) : null}
            <div className="relative flex items-start">
              <PostCardAvatar item={post} />
              <div className="min-w-0 flex-1 relative">{children}</div>
            </div>
          </div>
        </div>
        {footer}
      </div>
    </PostContext.Provider>
  )
}

PostCard.ItemMenu = PostCardMenu
PostCard.InlinePostHeader = PostCardHeader
PostCard.Content = PostCardContent
PostCard.MediaItems = PostCardMedia
PostCard.Actions = PostCardFooter
PostCard.RepostedBy = RepostedBy
