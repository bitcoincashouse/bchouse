import { ActiveCampaignsWidget } from '~/components/active-campaigns-widget'
import { StandardLayout } from '~/components/layouts/standard-layout'
import { Feed } from '~/components/post/feed'
import { StatsWidget } from '~/components/stats-widget'

export const handle: AppRouteHandle = {
  preventScrollReset: true,
  skipScrollRestoration: true,
}

export default function Index() {
  return (
    <StandardLayout
      title="Campaigns"
      hideXs
      headroom={true}
      main={<Feed id={'all'} queryKey="all_campaigns" />}
      widgets={[<StatsWidget />, <ActiveCampaignsWidget />]}
    />
  )
}
