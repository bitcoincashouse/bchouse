import { LoaderFunctionArgs } from '@remix-run/node'
import { useNavigate } from '@remix-run/react'
import { useEffect } from 'react'
import { ClientOnly } from '~/components/client-only'
import { useCurrentUser } from '~/components/context/current-user-context'
import { MentionCard } from '~/components/post-cards/notification-cards'
import { classnames } from '~/components/utils/classnames'
import { trpc } from '~/utils/trpc'

export const loader = async (_: LoaderFunctionArgs) => {
  await _.context.trpc.profile.getMentionNotifications.prefetch()
  return _.context.getDehydratedState()
}

export default function Index() {
  const getMentionNotifications = trpc.profile.getMentionNotifications.useQuery(
    undefined,
    {
      gcTime: 5 * 60 * 1000,
      staleTime: 1 * 60 * 1000,
    }
  )

  const notifications = getMentionNotifications.data?.notifications || []
  const currentUser = useCurrentUser()
  const navigate = useNavigate()

  return (
    <div className="flex flex-col">
      <ul className="flex flex-col divide-y divide-gray-100 dark:divide-gray-700 border-b border-gray-100 dark:border-gray-600">
        {notifications.map(({ notification, message }) => {
          return (
            <li key={notification.key}>
              <div className="flex flex-row items-center hover:bg-hover transition-all ease-in-out duration-300 cursor-pointer pl-2">
                <div
                  className={classnames(
                    'w-2 h-2 rounded-full',
                    !notification.viewed ? 'bg-blue-500' : ''
                  )}
                ></div>
                <MentionCard post={notification.post} />
              </div>
            </li>
          )
        })}
        <ClientOnly>{() => <UpdateLastViewed />}</ClientOnly>
      </ul>
    </div>
  )
}

function UpdateLastViewed() {
  const mutation = trpc.profile.updateLastViewedNotifications.useMutation()

  useEffect(() => {
    mutation.mutate()
  }, [])

  return null
}
