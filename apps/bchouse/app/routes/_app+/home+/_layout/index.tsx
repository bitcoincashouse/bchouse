import { LoaderFunctionArgs } from '@remix-run/node'
import { ClientLoaderFunctionArgs, Outlet } from '@remix-run/react'
import { $preload } from 'remix-query'
import { $path } from 'remix-routes'
import { redirect } from 'remix-typedjson'
import { ActiveCampaignsWidget } from '~/components/active-campaigns-widget'
import { StandardLayout } from '~/components/layouts/standard-layout'
import { NFTWidget } from '~/components/nft-widget'
import { StatsWidget } from '~/components/stats-widget'
import { getAuthOptional } from '~/utils/auth'
import { PostButton } from './post-button'
import { StatsHeader } from './stats-header'
import { Tabs } from './tabs'

export const handle = {
  title: 'Home',
  showFooter: false,
}

export const loader = async (_: LoaderFunctionArgs) => {
  const { userId } = await getAuthOptional(_)

  if (!userId) {
    const pathParts = new URL(_.request.url).pathname.split('/').filter(Boolean)

    if (pathParts[pathParts.length - 1] !== 'all') {
      throw redirect($path('/home/all'))
    }
  }

  return $preload(_, '/api/metrics/stats')
}

export const clientLoader = async (_: ClientLoaderFunctionArgs) => {
  return null
}

export default function Index() {
  return (
    <StandardLayout
      title="Home"
      hideXs
      hideBackButton={true}
      headroom={true}
      header={<Tabs />}
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
                        <StatsHeader />
                        <Outlet />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </article>
          </div>
          <PostButton />
        </div>
      }
      widgets={[<StatsWidget />, <ActiveCampaignsWidget />, <NFTWidget />]}
    ></StandardLayout>
  )
}
