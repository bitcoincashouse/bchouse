import { useFetcher } from '@remix-run/react'
import { $path } from 'remix-routes'
import { Theme } from '~/components/theme-provider'

export function useSetThemeFetcher() {
  //TODO: trpc.setTheme
  const fetcher = useFetcher()
  return {
    fetcher,
    submit: (theme: Theme) =>
      fetcher.submit(
        { theme },
        { action: $path('/api/setTheme'), method: 'post' }
      ),
  }
}
