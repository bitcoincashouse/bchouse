import { LoaderFunctionArgs } from '@remix-run/node'
import { useParams } from '@remix-run/react'
import { z } from 'zod'
import { useCurrentUser } from '~/components/context/current-user-context'
import { UserCard } from '~/components/user-card'
import { trpc } from '~/utils/trpc'
import { zx } from '~/utils/zodix'

export const loader = async (_: LoaderFunctionArgs) => {
  const { username } = zx.parseParams(_.params, { username: z.string() })
  await _.context.trpc.profile.listFollowing.prefetch({ username })
  return _.context.getDehydratedState()
}

export default function Index() {
  const username = useParams()?.username as string
  const listFollowing = trpc.profile.listFollowing.useQuery(
    {
      username,
    },
    {
      staleTime: 5 * 60 * 1000,
      gcTime: 15 * 60 * 1000,
    }
  )

  const currentUser = useCurrentUser()

  const isCurrentUser = currentUser.isAnonymous
    ? false
    : currentUser.username === username

  const { following = [] } = listFollowing.data || {}

  return (
    <>
      {following?.length ? (
        following.map((following) => (
          <UserCard user={following} key={following.id}></UserCard>
        ))
      ) : (
        <div className="flex flex-col items-center justify-center p-4 pt-8 gap-2">
          <h2 className="text-xl font-semibold text-secondary-text">
            Not following anyone yet
          </h2>
          {
            <p className="text-gray-400">
              When {isCurrentUser ? 'you follow' : `@${username} follows`}{' '}
              someone, you’ll see it here.
            </p>
          }
        </div>
      )}
    </>
  )
}
