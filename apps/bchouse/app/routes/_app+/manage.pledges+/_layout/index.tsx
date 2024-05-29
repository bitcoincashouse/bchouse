import { LoaderFunctionArgs } from '@remix-run/node'
import { Outlet } from '@remix-run/react'
import { $preload } from 'remix-query'
import { ActiveCampaignsWidget } from '~/components/active-campaigns-widget'
import { StandardLayout } from '~/components/layouts/standard-layout'
import { StatsWidget } from '~/components/stats-widget'
import { Header } from './header'

declare global {
  interface RouteDescription {
    pledges: {
      data: typeof loader
    }
  }
}

interface PledgesHandle extends AppRouteHandle, RouteHandler<'pledges'> {}

export const handle: PledgesHandle = {
  id: 'pledges',
  title: 'Pledges',
  showFooter: false,
}

export const loader = async (_: LoaderFunctionArgs) => {
  return $preload(_, '/api/campaign/pledge/list')
}

export default function Index() {
  return (
    <StandardLayout
      title="Pledges"
      hideBackButton={true}
      header={<Header />}
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
