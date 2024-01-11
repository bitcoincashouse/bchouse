import { LoaderArgs } from '@remix-run/node'
import { useParams } from '@remix-run/react'
import { useTypedLoaderData } from 'remix-typedjson'
import { z } from 'zod'
import { UserCard } from '~/components/user-card'
import { zx } from '~/utils/zodix'

export const loader = async (_: LoaderArgs) => {
  const { userId } = await _.context.authService.getAuthOptional(_)
  const { username } = zx.parseParams(_.params, { username: z.string() })
  return await _.context.profileService.getFollowing(userId, username)
}

export default function Index() {
  const { following, isCurrentUser } = useTypedLoaderData<typeof loader>()
  const { username } = useParams()

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
