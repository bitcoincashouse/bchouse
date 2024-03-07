import { ActionFunctionArgs, LoaderFunctionArgs } from '@remix-run/node'
import { useNavigate } from '@remix-run/react'
import { useEffect } from 'react'
import { typedjson, useTypedFetcher, useTypedLoaderData } from 'remix-typedjson'
import { ClientOnly } from '~/components/client-only'
import { PostCard } from '~/components/post/post-card'
import { classnames } from '~/components/utils/classnames'
import { useNotificationsLoaderData } from './_layout'

export const loader = async (_: LoaderFunctionArgs) => {
  const { userId } = await _.context.authService.getAuth(_)
  const notifications = await _.context.userService.getMentions(userId)

  return {
    notifications,
  }
}

export const action = async (_: ActionFunctionArgs) => {
  const { userId } = await _.context.authService.getAuth(_)
  const updated = await _.context.userService.updateLastViewedNotifications(
    userId
  )
  return typedjson(updated)
}

export default function Index() {
  const { notifications } = useTypedLoaderData<typeof loader>()
  const currentUser = useNotificationsLoaderData()
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
                <PostCard item={notification.post} className="w-full">
                  <div>
                    <div className="flex">
                      <PostCard.InlinePostHeader />
                      <div className="ml-auto">
                        <PostCard.ItemMenu />
                      </div>
                    </div>
                    <div className="-mt-1 text-sm text-secondary-text">
                      <span className="text-[15px]">Mentioned you</span>
                    </div>
                  </div>
                  <PostCard.Content />
                  <PostCard.MediaItems />
                  <PostCard.Actions />
                </PostCard>
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
  const updateLastViewed = useTypedFetcher<typeof action>()

  useEffect(() => {
    updateLastViewed.submit(
      {},
      {
        method: 'POST',
        encType: 'application/json',
      }
    )
  }, [])

  return null
}
