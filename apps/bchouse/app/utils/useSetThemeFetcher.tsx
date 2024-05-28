import { useFetcher } from '@remix-run/react'
import { $path } from 'remix-routes'
import { Theme } from '~/components/theme-provider'
import { action } from '~/routes/api+/setTheme'

//TODO: convert to remix-query
export function useSetThemeFetcher() {
  const fetcher = useFetcher<typeof action>()

  return {
    fetcher,
    submit: (theme: Theme) =>
      fetcher.submit(
        { theme },
        { action: $path('/api/setTheme'), method: 'post' }
      ),
  }
}
