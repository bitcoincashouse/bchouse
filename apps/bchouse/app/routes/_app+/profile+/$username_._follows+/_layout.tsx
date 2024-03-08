import { LoaderFunctionArgs } from '@remix-run/node'
import { NavLink, Outlet, useParams } from '@remix-run/react'
import { z } from 'zod'
import { ActionsPanel } from '~/components/actions'
import { StandardLayout } from '~/components/layouts/standard-layout'
import { classNames } from '~/utils/classNames'
import { trpc } from '~/utils/trpc'
import { zx } from '~/utils/zodix'

export const loader = async (_: LoaderFunctionArgs) => {
  const { username } = zx.parseParams(_.params, {
    username: z.string().nonempty(),
  })

  await _.context.trpc.profile.getPublicProfile.prefetch({
    username,
  })

  return _.context.getDehydratedState()
}

const tabs = [
  { name: 'Following', href: 'following' },
  { name: 'Followers', href: 'followers' },
]

export default function Index() {
  const username = useParams()?.username as string
  const getPublicProfile = trpc.profile.getPublicProfile.useQuery(
    {
      username,
    },
    {
      staleTime: 5 * 60 * 1000,
      gcTime: 15 * 60 * 1000,
    }
  )

  const profile = getPublicProfile.data

  if (!profile) {
    //TODO: Handle no profile data
    return null
  }

  return (
    <StandardLayout
      title={profile.name}
      subtitle={'@' + profile.username}
      hideBackButton={false}
      headroom={true}
      header={
        <>
          {' '}
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
                      '-mb-px flex space-x-8',
                      'flex-1 justify-around '
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
                              : 'border-transparent text-secondary-text hover:border-gray-300 hover:text-gray-700 hover:dark:text-secondary-text',
                            'whitespace-nowrap border-b-2 py-4 px-1 font-semibold'
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
                <div>
                  <div>
                    <div className="">
                      <div className="">
                        <Outlet />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </article>
          </div>
          {/* Actions panel */}
          <ActionsPanel actions={[]} />
        </div>
      }
    ></StandardLayout>
  )
}
