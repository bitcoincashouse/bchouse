/* eslint-disable react/display-name */
import { useLocation, useNavigate } from '@remix-run/react'
import React, { useMemo } from 'react'
import { classNames } from '~/utils/classNames'
import { trpc } from '~/utils/trpc'
import { PostCardModel } from '../post/types'
import { PostCardAvatar } from './avatar'
import { PostCardContent } from './content'
import { PostContext } from './context'
import { PostCardFooter } from './footer'
import { PostCardHeader } from './header'
import { PostCardMedia } from './media'
import { PostCardMenu } from './menu'
import { RepostedBy } from './reposted-by'

export function PostCard({
  item: post,
  children,
  footer,
  className,
}: {
  item: PostCardModel
  children?: React.ReactNode
  footer?: React.ReactNode
  className?: string
}) {
  const navigate = useNavigate()
  const location = useLocation()

  //For optimistic updates, get data from queryCache
  const { data } = trpc.post.getPost.useQuery(
    {
      postId: post.id,
    },
    {
      placeholderData: post,
      enabled: false,
      //TODO: stagger stale time, not to fetch all at same time,
      //TODO: only set while in view
      staleTime: 5 * 60 * 1000,
      gcTime: Infinity,
    }
  )

  const item = useMemo(() => {
    //Combine values returned via feed but not found via getPostById (ex. repostedBy)
    return { ...data!, repostedBy: post.repostedBy }
  }, [data, post.repostedBy])

  const handleClick: React.MouseEventHandler<HTMLDivElement> = (e) => {
    if (e.target instanceof HTMLAnchorElement) return

    //TODO:
    if (
      !item.person.handle ||
      !item.id ||
      item.deleted ||
      `/profile/${item.person.handle}/status/${item.id}` === location.pathname
    )
      return
    navigate(`/profile/${item.person.handle}/status/${item.id}`)
  }

  return (
    <PostContext.Provider value={item}>
      <div className={classNames(className, '')} onClick={handleClick}>
        <div
          className={classNames(
            'relative py-4 px-4',
            item.repostedBy ? 'pt-8' : ''
          )}
        >
          <div className="relative">
            {item.isThread ? (
              <span
                className="absolute top-8 left-5 -ml-px h-full w-0.5 bg-gray-200 dark:bg-gray-700"
                aria-hidden="true"
              />
            ) : null}
            <div className="relative flex items-start">
              <PostCardAvatar item={item} />
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
