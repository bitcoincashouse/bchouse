import { LoaderFunctionArgs } from '@remix-run/node'
import { useNavigate } from '@remix-run/react'
import { useEffect } from 'react'
import { $preload, $useActionMutation, $useLoaderQuery } from 'remix-query'
import { ClientOnly } from '~/components/client-only'
import { useCurrentUser } from '~/components/context/current-user-context'
import { MentionCard } from '~/components/post/card/implementations/notification-cards'
import { classnames } from '~/components/utils/classnames'

export const loader = async (_: LoaderFunctionArgs) => {
  return $preload(_, '/api/profile/mentions')
}

export default function Index() {
  const getMentionNotifications = $useLoaderQuery('/api/profile/mentions', {
    gcTime: 5 * 60 * 1000,
    staleTime: 1 * 60 * 1000,
  })

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
  const mutation = $useActionMutation('/api/profile/lastViewedNotifications')

  useEffect(() => {
    mutation.mutate()
  }, [])

  return null
}
