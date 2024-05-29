import {
  Outlet,
  useLocation,
  useNavigation,
  useSearchParams,
} from '@remix-run/react'
import { AnyFunction, isFunction, isString } from 'is-what'
import { useMemo } from 'react'
import { ActiveCampaignsWidget } from '~/components/active-campaigns-widget'
import { StandardLayout } from '~/components/layouts/standard-layout'
import { Search } from '~/components/search/autocomplete-search'
import { StatsWidget } from '~/components/stats-widget'
import { useFindMatchHandle } from '~/utils/appHooks'

function isStringOrMatchFunction(val: unknown): val is string | AnyFunction {
  return isString(val) || isFunction(val)
}

function useSearchQuery() {
  const result = useFindMatchHandle('query', isStringOrMatchFunction)
  const [searchParams] = useSearchParams()

  const navigation = useNavigation()
  const defaultQuery =
    new URLSearchParams(navigation.location?.search).get('q') ||
    searchParams.get('q') ||
    undefined

  const queryOrFn = result?.handle?.query
  const query = useMemo(() => {
    if (!queryOrFn) return undefined
    if (isString(queryOrFn)) return queryOrFn

    try {
      const query = queryOrFn(result)
      return isString(query) ? query : undefined
    } catch (err) {
      return undefined
    }
  }, [queryOrFn])

  return query || defaultQuery
}

export default function Index() {
  const query = useSearchQuery()
  const location = useLocation()

  return (
    <StandardLayout
      hideSearch
      hideBackButton
      header={
        <div className="hidden non-mobile:block px-6 py-2 lg:py-4 w-full">
          <Search key={location.key} query={query} />
        </div>
      }
      main={<Outlet />}
      widgets={[<StatsWidget />, <ActiveCampaignsWidget />]}
    />
  )
}
