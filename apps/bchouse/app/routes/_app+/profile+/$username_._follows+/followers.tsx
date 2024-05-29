import { LoaderFunctionArgs } from '@remix-run/node'
import { useParams } from '@remix-run/react'
import { $preload, $useLoaderQuery } from 'remix-query'
import { z } from 'zod'
import { useCurrentUser } from '~/components/context/current-user-context'
import { UserCard } from '~/components/user-card'
import { zx } from '~/utils/zodix'

export const loader = async (_: LoaderFunctionArgs) => {
  const { username } = zx.parseParams(_.params, { username: z.string() })
  return $preload(_, '/api/profile/followers/:username', { username })
}

export default function Index() {
  const { username } = useParams<{ username: string }>()
  const { data } = $useLoaderQuery('/api/profile/followers/:username', {
    params: {
      username: username!,
    },
    enabled: !!username,
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
  })
  const currentUser = useCurrentUser()
  const isCurrentUser =
    !currentUser.isAnonymous && currentUser.username === username
  const { followers = [] } = data || {}

  return (
    <>
      {followers?.length ? (
        followers.map((follower) => (
          <UserCard user={follower} key={follower.id}></UserCard>
        ))
      ) : (
        <div className="flex flex-col items-center justify-center p-4 pt-8 gap-2">
          <h2 className="text-xl font-semibold text-secondary-text">
            No followers yet
          </h2>
          {
            <p className="text-gray-400">
              When someone follows {isCurrentUser ? 'you' : `@${username}`},
              you’ll see it here.
            </p>
          }
        </div>
      )}
    </>
  )
}
