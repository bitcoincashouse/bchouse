import type { FetcherWithComponents } from '@remix-run/react'
import type { UseDataFunctionReturn } from 'remix-typedjson'
import { useTypedFetcher as useTypedFetcherOriginal } from 'remix-typedjson'

export function useTypedFetcher<T>(): Omit<FetcherWithComponents<T>, 'data'> & {
  data: UseDataFunctionReturn<T> | undefined
} {
  return useTypedFetcherOriginal<T>()
}
