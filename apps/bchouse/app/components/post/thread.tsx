import React, { useRef, useState } from 'react'
import { useBrowserLayoutEffect } from '~/utils/useBrowserLayoutEffect'
import { classnames } from '../utils/classnames'
import { Post } from './threads/post'
import { FeedResponse } from './threads/types'
import { useScrollRestore } from './threads/useScrollRestore'
import { PostCardModel } from './types'

export const Thread: React.FC<{
  mainPost: PostCardModel
  initialPosts: Extract<FeedResponse, { posts: any }>['posts']
  nextCursor?: string | undefined
  previousCursor?: string | undefined
  currentUser?: {
    username: string
    avatarUrl: string | undefined
  }
}> = (props) => {
  const { mainPost, initialPosts, currentUser } = props

  const mainPostId = mainPost.id
  const listRef = useRef<HTMLUListElement | null>(null)

  const scrollState = useScrollRestore()
  const [wasRendered, setWasRendered] = useState(false)
  useBrowserLayoutEffect(() => {
    if (typeof window === 'undefined') return

    if (scrollState) {
      window.scrollTo({ top: scrollState })
    } else {
      const mainPost = listRef.current?.querySelector(
        '#currentPost'
      ) as HTMLDivElement

      if (mainPost) {
        const targetOffset =
          mainPost.offsetTop + (window.innerWidth >= 640 ? -60 : 0)

        window.scrollTo({ top: targetOffset, behavior: 'instant' })
      }
    }
    setWasRendered(true)
  }, [])

  return (
    <div>
      <div>
        <div>
          <div className="">
            <div className="">
              {/* Activity feed*/}
              <div className="flow-root">
                <ul
                  role="list"
                  ref={listRef}
                  className={classnames(
                    'border-gray-100 dark:border-gray-600 min-h-screen',
                    !wasRendered && 'invisible'
                  )}
                >
                  {initialPosts.map((post) => (
                    <Post
                      key={post.key}
                      mainPostId={mainPostId}
                      post={post}
                      currentUser={currentUser}
                    />
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
