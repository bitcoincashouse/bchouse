import { Link } from '@remix-run/react'
import { useState } from 'react'
import { $path } from 'remix-routes'
import { useCurrentUser } from '~/components/context/current-user-context'
import { PostForm } from '../../post/form/implementations/post-form'
import { useCampaignThread } from '../../thread-provider'
import { classnames } from '../../utils/classnames'
import { AllComments } from './all-comments'
import { DonorComments } from './donor-comments'

const tabs = [
  { name: 'Donors', id: 'donors' },
  { name: 'All', id: 'all' },
] as const

export function CampaignThreadComments() {
  const posts = useCampaignThread()
  const currentUser = useCurrentUser()

  //TODO: Create CampaignPostCardModel from PostCardModel for CampaignPosts
  const [activeTabId, setActiveTabId] = useState<'all' | 'donors'>(
    posts.main.monetization?.campaignId ? 'donors' : 'all'
  )

  return (
    <>
      <section
        aria-labelledby="applicant-information-title"
        className="border-b border-gray-100 dark:border-gray-600 max-w-full overflow-x-auto"
      >
        <div>
          <div className="px-4 sm:px-6">
            <div className="overflow-x-auto h-full overflow-y-hidden">
              <div className="flex mx-auto max-w-5xl">
                <nav
                  className={classnames('flex justify-around space-x-8 flex-1')}
                  aria-label="Tabs"
                >
                  {tabs.map((tab, i) => {
                    return (
                      <button
                        key={tab.name}
                        onClick={() => setActiveTabId(tab.id)}
                        className={classnames(
                          tab.id === activeTabId
                            ? 'border-pink-500 text-primary-text'
                            : 'border-transparent text-secondary-text hover:border-gray-300 hover:dark:text-secondary-text',
                          'whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium'
                        )}
                      >
                        {tab.name}
                      </button>
                    )
                  })}
                </nav>
              </div>
            </div>
          </div>
        </div>
      </section>
      {!posts.main.deleted && !currentUser.isAnonymous ? (
        <div
          className={classnames(
            'px-4 py-6 sm:px-6 border-b border-gray-100 dark:border-gray-600',
            activeTabId === 'all' ? '' : 'hidden'
          )}
        >
          <PostForm
            placeholder="Post a reply!"
            parentPost={{
              id: posts.main.id,
              publishedById: posts.main.publishedById,
            }}
            heading={
              <div className="text-gray-600">
                <span>
                  Replying to{' '}
                  <Link
                    className="link"
                    to={$path('/profile/:username', {
                      username: posts.main.person.handle,
                    })}
                  >
                    @{posts.main.person.handle}
                  </Link>
                </span>
              </div>
            }
          />
        </div>
      ) : null}

      {activeTabId === 'all' ? (
        <>
          <AllComments childPosts={posts.replies} currentUser={currentUser} />
        </>
      ) : (
        <DonorComments childPosts={posts.donors} />
      )}
    </>
  )
}
