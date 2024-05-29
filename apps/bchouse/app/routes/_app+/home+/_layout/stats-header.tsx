import { Link } from '@remix-run/react'
import { $path } from 'remix-routes'
import { useCurrentUser } from '~/components/context/current-user-context'
import { PostForm } from '~/components/post/form/implementations/post-form'
import { useStatsQuery } from '~/hooks/useStatsQuery'
import { classNames } from '~/utils/classNames'

export function StatsHeader() {
  const currentUser = useCurrentUser()
  const {
    data: { userCount = 0, dailyActiveUserCount = 0 } = {},
    isLoading: isLoadingStats,
  } = useStatsQuery()

  if (currentUser.isAnonymous) {
    return null
  }

  return (
    <>
      <div className="hidden sm:block border-b dark:border-gray-600 px-4 py-6 sm:px-6">
        <PostForm
          showAudience
          placeholder="What's building?"
          formClassName="flex !flex-col"
        />
      </div>
      <div className="lg:hidden flex flex-row flex-wrap items-center mx-auto justify-around text-sm pt-3 gap-2">
        {isLoadingStats ? null : (
          <>
            <span>Registered Users: {userCount} </span>
            <span>Active (24hrs): {dailyActiveUserCount}</span>
            <div className="flex">
              <Link
                to={$path('/invite')}
                className={classNames(
                  'ml-auto inline-flex items-center justify-center rounded-full border border-transparent bg-purple-500 px-3 py-1 text-xs font-medium text-white shadow-sm hover:bg-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2'
                )}
              >
                Invite new users
              </Link>
            </div>
          </>
        )}
      </div>
    </>
  )
}
