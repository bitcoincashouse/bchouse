import React, { useRef, useState } from 'react'
import { useCurrentUser } from '~/components/context/current-user-context'
import { useBrowserLayoutEffect } from '~/utils/useBrowserLayoutEffect'
import { ThreadPost } from '../post/card/implementations/thread-card'
import { PostCardModel } from '../post/types'
import { classnames } from '../utils/classnames'
import { useScrollRestore } from './useScrollRestore'

export const Thread: React.FC<{
  mainPost: PostCardModel
  showImagesMainPost?: boolean
  initialPosts: PostCardModel[]
  nextCursor?: string | undefined
  previousCursor?: string | undefined
}> = (props) => {
  const { mainPost, initialPosts } = props
  const currentUser = useCurrentUser()

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
                    <ThreadPost
                      key={post.key}
                      mainPostId={mainPostId}
                      showImagesMainPost={props.showImagesMainPost}
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
