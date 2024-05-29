import { LoaderFunctionArgs } from '@remix-run/node'
import { MentionCard } from '~/components/post/card/implementations/notification-cards'
import { classnames } from '~/components/utils/classnames'
import { UpdateLastViewed } from './_layout/components/update-last-viewed'
import {
  preloadMentionsQuery,
  useMentionsQuery,
} from './_layout/hooks/useMentionsQuery'

export const loader = async (_: LoaderFunctionArgs) => {
  return preloadMentionsQuery(_)
}

export default function Index() {
  const { data: { notifications = [] } = {} } = useMentionsQuery()

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
        <UpdateLastViewed />
      </ul>
    </div>
  )
}
