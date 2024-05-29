import { LoaderFunctionArgs } from '@remix-run/node'
import { NotificationItem } from './_layout/components/notification-item'
import {
  preloadNotificationsQuery,
  useNotificationsQuery,
} from './_layout/hooks/useNotificationsQuery'

export const loader = async (_: LoaderFunctionArgs) => {
  return preloadNotificationsQuery(_)
}

export default function Index() {
  const { data: { notifications = [] } = {} } = useNotificationsQuery()

  return (
    <div className="flex flex-col">
      <ul className="flex flex-col divide-y divide-gray-100 dark:divide-gray-700 border-b border-gray-100 dark:border-gray-600">
        {notifications.map((notification) => (
          <NotificationItem
            notification={notification}
            key={notification.key}
          />
        ))}
      </ul>
    </div>
  )
}
