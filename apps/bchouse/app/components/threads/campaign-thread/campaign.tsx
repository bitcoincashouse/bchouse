import { useCurrentUser } from '~/components/context/current-user-context'
import { ThreadPost } from '../../post/card/implementations/thread-card'
import { useCampaignThread } from '../../thread-provider'
import { classnames } from '../../utils/classnames'
import { useCommentScroll } from '../useCommentScroll'
import { useInfiniteScroll } from '../useInfiniteScroll'
import { CampaignThreadComments } from './campaign-thread-comments'
import { PledgeButton } from './pledge-button'
import { useInitialPosts } from './useInitialPosts'

export function CampaignThread() {
  const currentUser = useCurrentUser()
  const { main } = useCampaignThread()
  const { feedRef, shouldRender } = useCommentScroll()
  const initialPosts = useInitialPosts()
  const ancestorFeedState = useInfiniteScroll({
    initialPosts,
    mainPostId: main.id,
    key: 'ancestors',
  })

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
                    'divide-y divide-gray-100 dark:divide-gray-700 border-gray-100 dark:border-gray-600 min-h-screen flex flex-col',
                    !shouldRender && 'invisible'
                  )}
                >
                  <div>
                    {ancestorFeedState.posts.map((post) => (
                      <ThreadPost
                        key={post.key}
                        mainPostId={main.id}
                        post={post}
                        currentUser={currentUser}
                        actionButton={
                          post.id === main.id ? <PledgeButton /> : null
                        }
                      />
                    ))}

                    <CampaignThreadComments />
                  </div>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
