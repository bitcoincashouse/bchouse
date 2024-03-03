import { logger } from '@bchouse/utils'
import { LoaderArgs } from '@remix-run/node'
import { ClientLoaderFunctionArgs } from '@remix-run/react'
import { useEffect } from 'react'
import { $path } from 'remix-routes'
import { typedjson } from 'remix-typedjson'
import { z } from 'zod'
import { Widget } from '~/components/layouts/widget'
import { UserCard } from '~/components/user-card'
import { useTypedFetcher } from '~/utils/useTypedFetcher'
import { zx } from '~/utils/zodix'
import { useLayoutLoaderData } from './_app/route'

export const loader = async (_: LoaderArgs) => {
  try {
    await _.context.ratelimit.limitByIp(_, 'api', true)

    const { userId } = zx.parseParams(_.params, {
      userId: z.string(),
    })

    //Only return follow suggestions for logged in users
    const { userId: currentUserId } = await _.context.authService.getAuth(_)

    const followSuggestions =
      await _.context.profileService.getRelatedFollowSuggestions(
        userId,
        currentUserId
      )
    return typedjson({ followSuggestions })
  } catch (err) {
    logger.error(err)
    return typedjson({ followSuggestions: [] })
  }
}

export async function clientLoader({ serverLoader }: ClientLoaderFunctionArgs) {
  try {
    return await serverLoader()
  } catch (err) {
    return typedjson({ followSuggestions: [] })
  }
}

export function useFollowSuggestionsQuery(userId: string) {
  const layoutData = useLayoutLoaderData()
  const fetcher = useTypedFetcher<typeof loader>()

  useEffect(() => {
    if (!layoutData.anonymousView) {
      fetcher.load(
        $path('/api/follow-suggestions/:userId', {
          userId,
        })
      )
    }
  }, [layoutData.anonymousView, userId])

  return fetcher
}

export function RelatedFollowSuggestions({ user }: { user: string }) {
  const fetcher = useFollowSuggestionsQuery(user)
  const data = fetcher.data?.followSuggestions

  return data?.length ? (
    <Widget
      items={data}
      keyProp={'id'}
      render={(follower) => (
        <UserCard
          aboutClassName="text-sm"
          followButtonClassName="px-2 py-1 gap-x-1"
          user={follower}
          key={follower.id}
        ></UserCard>
      )}
      title="You might like"
      listClassName="px-0 py-4 divide-none -my-6"
      itemClassName="py-0"
    >
      {/* <div className="link pl-4 py-2">
        <Link to={'/connect?user=' + user} className="link">
          Show more
        </Link>
      </div> */}
    </Widget>
  ) : null
}
