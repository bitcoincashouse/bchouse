import { ArrowPathIcon, HeartIcon } from '@heroicons/react/20/solid'
import { ActionArgs, LoaderArgs } from '@remix-run/node'
import { Link, useNavigate } from '@remix-run/react'
import { useEffect } from 'react'
import { $path } from 'remix-routes'
import { typedjson, useTypedFetcher, useTypedLoaderData } from 'remix-typedjson'
import { Avatar } from '~/components/avatar'
import { ClientOnly } from '~/components/client-only'
import { BitcoinIcon } from '~/components/icons/BitcoinIcon'
import { PostCard } from '~/components/post/post-card'
import { classnames } from '~/components/utils/classnames'
import { classNames } from '~/utils/classNames'
import { useNotificationsLoaderData } from './_app.notifications'

export const loader = async (_: LoaderArgs) => {
  const { userId } = await _.context.authService.getAuth(_)
  const notifications = await _.context.userService.getNotifications(userId)

  return {
    notifications,
  }
}

export const action = async (_: ActionArgs) => {
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
                {notification.type === 'REPLY' ? (
                  <PostCard item={notification.post} className="w-full">
                    <div>
                      <div className="flex">
                        <PostCard.InlinePostHeader />
                        <div className="ml-auto">
                          <PostCard.ItemMenu />
                        </div>
                      </div>
                      <div className="-mt-1 text-sm text-secondary-text">
                        <span className="text-[15px]">
                          Replying to{' '}
                          <Link
                            className="link hover:underline"
                            to={$path('/profile/:username', {
                              username: currentUser.username,
                            })}
                          >
                            @{currentUser.username}
                          </Link>
                        </span>
                      </div>
                    </div>
                    <PostCard.Content />
                    <PostCard.MediaItems />
                    <PostCard.Actions />
                  </PostCard>
                ) : notification.type === 'MENTION' ? (
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
                ) : (
                  <div
                    className="block"
                    onClick={(e) => {
                      if (e.target instanceof HTMLAnchorElement) return
                      navigate(notification.href)
                    }}
                  >
                    <div className={classNames('relative py-4 px-4')}>
                      <div className="relative">
                        <div className="relative flex items-center">
                          <>
                            <div className="relative mr-2">
                              {notification.type === 'FOLLOW' ||
                              (notification.type === 'TIP' &&
                                notification.user.avatarUrl) ? (
                                // TODO: show several followers in a row
                                <Avatar
                                  className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-400 ring-8 ring-transparent"
                                  src={notification.user.avatarUrl || ''}
                                  alt=""
                                />
                              ) : (
                                <>
                                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 ring-8 ring-transparent p-2">
                                    {notification.type === 'LIKE' ? (
                                      <HeartIcon className="h-8 w-8 text-rose-600" />
                                    ) : null}

                                    {notification.type === 'TIP' ? (
                                      <BitcoinIcon className="h-8 w-8 text-[#0ac18e]-600" />
                                    ) : null}

                                    {notification.type === 'REPOST' ? (
                                      <ArrowPathIcon className="h-8 w-8 text-green-600" />
                                    ) : null}
                                  </div>
                                </>
                              )}
                            </div>
                            <div className="min-w-0 flex-1 relative">
                              {message}
                            </div>
                          </>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
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
