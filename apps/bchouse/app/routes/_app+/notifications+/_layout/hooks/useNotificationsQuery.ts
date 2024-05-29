import { LoaderFunctionArgs } from '@remix-run/node'
import { $preload, $useLoaderQuery, Routes } from 'remix-query'

export type Notification =
  Routes['/api/profile/notifications']['loaderResult']['notifications'][number]

export function preloadNotificationsQuery(_: LoaderFunctionArgs) {
  return $preload(_, '/api/profile/notifications')
}

export function useNotificationsQuery() {
  return $useLoaderQuery('/api/profile/notifications', {
    gcTime: 5 * 60 * 1000,
    staleTime: 1 * 60 * 1000,
  })
}
