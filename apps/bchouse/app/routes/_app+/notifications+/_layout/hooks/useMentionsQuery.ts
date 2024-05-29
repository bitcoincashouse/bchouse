import { LoaderFunctionArgs } from '@remix-run/node'
import { $preload, $useLoaderQuery } from 'remix-query'

export function preloadMentionsQuery(_: LoaderFunctionArgs) {
  return $preload(_, '/api/profile/mentions')
}

export function useMentionsQuery() {
  return $useLoaderQuery('/api/profile/mentions', {
    gcTime: 5 * 60 * 1000,
    staleTime: 1 * 60 * 1000,
  })
}
