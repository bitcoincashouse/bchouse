import React from 'react'
import { useCurrentUser } from '~/components/context/current-user-context'
import { ThreadPost } from '../post/card/implementations/thread-card'
import { useStatusThread } from '../thread-provider'
import { classnames } from '../utils/classnames'
import { useCommentScroll } from './useCommentScroll'

export const Thread: React.FC<{
  showImagesMainPost?: boolean
}> = (props) => {
  const posts = useStatusThread()
  const currentUser = useCurrentUser()
  const { feedRef, shouldRender } = useCommentScroll()

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
                  ref={feedRef}
                  className={classnames(
                    'border-gray-100 dark:border-gray-600 min-h-screen',
                    !shouldRender && 'invisible'
                  )}
                >
                  {posts.all.map((post) => (
                    <ThreadPost
                      key={post.key}
                      mainPostId={posts.main.id}
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
