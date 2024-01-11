import { FetcherWithComponents } from '@remix-run/react'

export function isFetcherDone(fetcher: FetcherWithComponents<any>) {
  return fetcher.state === 'idle' && typeof fetcher.data !== 'undefined'
}
