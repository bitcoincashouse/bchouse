import { LoaderFunctionArgs } from '@remix-run/node'
import { NavLink, Outlet } from '@remix-run/react'
import { UseDataFunctionReturn, typedjson } from 'remix-typedjson'
import { StandardLayout } from '~/components/layouts/standard-layout'
import { classNames } from '~/utils/classNames'
import { getPledgeSession } from '~/utils/pledgeCookie.server'
import { ActiveCampaignsWidget } from '../components/active-campaigns-widget'
import { StatsWidget } from '../components/stats-widget'
import { useAppLoaderData } from '../utils/appHooks'

declare global {
  interface RouteDescription {
    pledges: {
      data: typeof loader
    }
  }
}

interface PledgesHandle extends AppRouteHandle, RouteHandler<'pledges'> {}

const tabs = [
  { name: 'All', href: '' },
  { name: 'Current', href: 'current' },
  { name: 'Refunded', href: 'refunded' },
  { name: 'Fulfilled', href: 'fulfilled' },
]

export const handle: PledgesHandle = {
  id: 'pledges',
  title: 'Pledges',
  showFooter: false,
}

export function usePledgesLoaderData() {
  return useAppLoaderData(handle)
}

export type PledgeData = UseDataFunctionReturn<typeof loader>['pledges'][number]

export const loader = async (_: LoaderFunctionArgs) => {
  const { userId } = await _.context.authService.getAuthOptional(_)
  const pledgeSession = await getPledgeSession(_.request)
  const pledgeSecrets = pledgeSession.getPledgeSecrets()

  const pledges = await _.context.pledgeService.getPledges({
    userId,
    pledgeSecrets,
  })

  return typedjson({
    pledges,
  })
}

export default function Index() {
  return (
    <StandardLayout
      title="Pledges"
      hideBackButton={true}
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
                              : 'border-transparent text-secondary-text hover:border-gray-300 hover:dark:text-secondary-text',
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
                <div className="">
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
        </div>
      }
      widgets={[<StatsWidget />, <ActiveCampaignsWidget />]}
    ></StandardLayout>
  )
}
