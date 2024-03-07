import { ActiveCampaignsWidget } from '~/components/active-campaigns-widget'
import { StandardLayout } from '~/components/layouts/standard-layout'
import { Feed } from '~/components/post/feed'
import { StatsWidget } from '~/components/stats-widget'
import { layoutHandle } from '~/routes/_app/route'
import { useAppLoaderData } from '~/utils/appHooks'

export const handle: AppRouteHandle = {
  preventScrollReset: true,
  skipScrollRestoration: true,
}

export default function Index() {
  const layoutData = useAppLoaderData(layoutHandle)

  return (
    <StandardLayout
      title="Campaigns"
      hideXs
      headroom={true}
      main={
        <Feed
          currentUser={
            layoutData.anonymousView ? undefined : layoutData.profile
          }
          id={'all'}
          queryKey="all_campaigns"
        />
      }
      widgets={[<StatsWidget />, <ActiveCampaignsWidget />]}
    />
  )
}
