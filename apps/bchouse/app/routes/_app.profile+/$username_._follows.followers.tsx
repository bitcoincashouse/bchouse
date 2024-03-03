import { LoaderFunctionArgs } from '@remix-run/node'
import { useParams } from '@remix-run/react'
import { useTypedLoaderData } from 'remix-typedjson'
import { z } from 'zod'
import { UserCard } from '~/components/user-card'
import { zx } from '~/utils/zodix'

export const loader = async (_: LoaderFunctionArgs) => {
  const { userId } = await _.context.authService.getAuthOptional(_)
  const { username } = zx.parseParams(_.params, { username: z.string() })
  return await _.context.profileService.getFollowers(userId, username)
}

export default function Index() {
  const { followers, isCurrentUser } = useTypedLoaderData<typeof loader>()
  const { username } = useParams()

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
