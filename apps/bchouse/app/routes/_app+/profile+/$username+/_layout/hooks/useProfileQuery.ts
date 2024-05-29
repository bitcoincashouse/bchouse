import { useParams } from '@remix-run/react'
import { $useLoaderQuery } from 'remix-query'

export function useProfileQuery() {
  const { username } = useParams<{ username: string }>()

  return $useLoaderQuery('/api/profile/getPublicProfile/:username', {
    params: {
      username: username!,
    },
    enabled: !!username,
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
  })
}
