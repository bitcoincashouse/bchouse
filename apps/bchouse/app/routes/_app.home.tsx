import { LoaderArgs } from '@remix-run/node'
import { Link, NavLink, Outlet, useLocation } from '@remix-run/react'
import { useMemo } from 'react'
import { $path } from 'remix-routes'
import { redirect, typedjson, useTypedLoaderData } from 'remix-typedjson'
import { StandardLayout } from '~/components/layouts/standard-layout'
import { PostForm } from '~/components/post/post-form'
import { layoutHandle } from '~/routes/_app/route'
import { useAppLoaderData } from '~/utils/appHooks'
import { classNames } from '~/utils/classNames'
import { ActiveCampaignsWidget } from './api.campaigns.active.($username)'
import { PersonalizedFollowSuggestions } from './api.follow-suggestions.personalized'
import { StatsWidget } from './api.stats'

export const handle = {
  title: 'Home',
  showFooter: false,
}

export const loader = async (_: LoaderArgs) => {
  const { userId } = await _.context.authService.getAuthOptional(_)

  if (!userId) {
    const pathParts = new URL(_.request.url).pathname.split('/').filter(Boolean)

    if (pathParts[pathParts.length - 1] !== 'all') {
      throw redirect($path('/home/all'))
    }
  }

  const { userCount, dailyActiveUserCount, weeklyActiveUserCount } =
    await _.context.userService.getUserCounts()

  return typedjson({
    userId,
    userCount,
    dailyActiveUserCount,
    weeklyActiveUserCount,
  })
}

export default function Index() {
  const layoutData = useAppLoaderData(layoutHandle)
  const location = useLocation()
  const { userCount, dailyActiveUserCount, weeklyActiveUserCount } =
    useTypedLoaderData<typeof loader>()

  const tabs = useMemo(() => {
    return layoutData.anonymousView
      ? [{ name: 'All', href: 'all' }]
      : [
          { name: 'All', href: 'all' },
          { name: 'Following', href: '' },
        ]
  }, [])

  const pathParts = location.pathname.split('/')
  const hidePostButton =
    layoutData.anonymousView ||
    (pathParts.indexOf('profile') !== -1 && pathParts.indexOf('status') !== -1)

  return (
    <StandardLayout
      title="Home"
      hideXs
      hideBackButton={true}
      headroom={true}
      header={
        <>
          {/* Description list*/}
          <section
            aria-labelledby="applicant-information-title"
            className="border-b border-gray-100 dark:border-gray-600 "
          >
            <div className="px-4 sm:px-6">
              <div className="overflow-x-auto h-full overflow-y-hidden">
                <div className="flex mx-auto max-w-5xl">
                  <nav
                    className={classNames(
                      '-mb-px flex flex-1 justify-around gap-8 mx-8'
                    )}
                    aria-label="Tabs"
                  >
                    {tabs.map((tab, i) => (
                      <NavLink
                        key={tab.name}
                        to={tab.href}
                        end={true}
                        className={({ isActive }) =>
                          classNames(
                            isActive
                              ? 'border-pink-500 text-primary-text'
                              : 'border-transparent text-secondary-text hover:border-gray-300 hover:dark:text-secondary-text',
                            'flex-1 flex justify-center whitespace-nowrap border-b-2 py-4 px-1 font-semibold'
                          )
                        }
                      >
                        {tab.name}
                      </NavLink>
                    ))}
                  </nav>
                </div>
              </div>
            </div>
          </section>
        </>
      }
      main={
        <div>
          <div>
            <article className="max-w-5xl mx-auto">
              <section aria-labelledby="profile-overview-title">
                <div className="shadow">
                  <h2 className="sr-only" id="profile-overview-title">
                    Profile Overview
                  </h2>
                </div>
              </section>
              <div className="min-h-[1500px]">
                <div className="bg-primary">
                  <div>
                    <div className="">
                      <div className="">
                        {!layoutData.anonymousView ? (
                          <>
                            <div className="hidden sm:block border-b dark:border-gray-600 px-4 py-6 sm:px-6">
                              <PostForm
                                showAudience
                                user={layoutData.profile}
                                placeholder="What's building?"
                                formClassName="flex !flex-col"
                              />
                            </div>
                            <div className="lg:hidden flex flex-row flex-wrap items-center mx-auto justify-around text-sm pt-3 gap-2">
                              <span>Registered Users: {userCount} </span>
                              <span>
                                Active (24hrs): {dailyActiveUserCount}
                              </span>
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
                            </div>
                          </>
                        ) : null}
                        <Outlet />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </article>
          </div>
          {/* post button */}
          {!hidePostButton ? (
            <div className="sm:hidden fixed bottom-20 right-8">
              <div className="flex justify-center">
                <Link
                  to={{ search: '?modal=create-post' }}
                  replace={true}
                  preventScrollReset={true}
                  type="button"
                  className="min-h-[60px] min-w-[60px] text-center inline-flex items-center justify-center rounded-full w-full bg-primary-btn-400 tracking-wide px-4 py-2.5 text-base font-semibold text-white shadow-sm hover:bg-primary-btn-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-btn-600"
                >
                  <span className="hidden xl:block">+</span>
                  <div className="xl:hidden">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="w-6 h-6"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 4.5v15m7.5-7.5h-15"
                      />
                    </svg>
                  </div>
                </Link>
              </div>
            </div>
          ) : null}
        </div>
      }
      widgets={[
        <StatsWidget
          shouldLoad={false}
          initialData={{
            userCount,
            dailyActiveUserCount,
            weeklyActiveUserCount,
          }}
        />,
        <ActiveCampaignsWidget />,
        <PersonalizedFollowSuggestions />,
      ]}
    ></StandardLayout>
  )
}
