import { Outlet, useLocation } from '@remix-run/react'
import { ActiveCampaignsWidget } from '~/components/active-campaigns-widget'
import { StandardLayout } from '~/components/layouts/standard-layout'
import { Search } from '~/components/search/autocomplete-search'
import { StatsWidget } from '~/components/stats-widget'
import { useSearchTerm } from './hooks/useSearchTerm'

export default function Index() {
  const searchTerm = useSearchTerm()
  const location = useLocation()

  return (
    <StandardLayout
      hideSearch
      hideBackButton
      header={
        <div className="hidden non-mobile:block px-6 py-2 lg:py-4 w-full">
          <Search key={location.key} query={searchTerm} />
        </div>
      }
      main={<Outlet />}
      widgets={[<StatsWidget />, <ActiveCampaignsWidget />]}
    />
  )
}
