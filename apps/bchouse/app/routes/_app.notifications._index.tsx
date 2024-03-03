import { moment, prettyPrintSats } from '@bchouse/utils'
import { ArrowPathIcon, HeartIcon, UserIcon } from '@heroicons/react/20/solid'
import { LoaderArgs } from '@remix-run/node'
import { Link, useNavigate } from '@remix-run/react'
import { $path } from 'remix-routes'
import { useTypedLoaderData } from 'remix-typedjson'
import { Avatar } from '~/components/avatar'
import { BitcoinIcon } from '~/components/icons/BitcoinIcon'
import { PostCard, PostProvider } from '~/components/post/post-card'
import { classnames } from '~/components/utils/classnames'
import { Activity } from '~/server/services/redis/activity'
import { classNames } from '~/utils/classNames'
import { useNotificationsLoaderData } from './_app.notifications'

export const loader = async (_: LoaderArgs) => {
  const { userId } = await _.context.authService.getAuth(_)
  const notifications = await _.context.userService.getNotifications(userId)

  return {
    notifications,
  }
}

export default function Index() {
  const { notifications } = useTypedLoaderData<typeof loader>()
  const currentUser = useNotificationsLoaderData()
  const navigate = useNavigate()
  return (
    <div className="flex flex-col">
      <ul className="flex flex-col divide-y divide-gray-100 dark:divide-gray-700 border-b border-gray-100 dark:border-gray-600">
        {notifications.map((notification) => {
          const sourceUsername = (
            <Link
              to={'/profile/' + notification.users[0]?.username}
              key={notification.users[0]?.id}
              className="font-semibold text-primary-text hover:underline"
            >
              {notification.users[0]?.displayName}
            </Link>
          )

          const otherUsersBody =
            notification.users.length > 1 ? (
              <>
                {' '}
                and{' '}
                {notification.users.length > 2 ? (
                  `${notification.users.length - 1} others`
                ) : (
                  <Link
                    to={'/profile/' + notification.users[1]?.username}
                    className="font-semibold text-primary-text hover:underline"
                  >
                    {notification.users[1]?.displayName}
                  </Link>
                )}{' '}
              </>
            ) : (
              ' '
            )

          const notificationAction =
            typeToAction[notification.type] +
            (notification.type === 'tip'
              ? ' ' + prettyPrintSats(notification.totalAmount).join('')
              : '')

          return (
            <li key={notification.key}>
              <div
                className={classnames(
                  'flex flex-row items-center hover:bg-hover transition-all ease-in-out duration-300 cursor-pointer pl-2',
                  !notification.viewed
                    ? 'bg-blue-600/10 dark:bg-blue-500/10'
                    : ''
                )}
              >
                {notification.type === 'reply' ? (
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
                ) : notification.type === 'mention' ? (
                  <PostCard item={notification.post} className="w-full">
                    <div>
                      <div className="flex">
                        <PostCard.InlinePostHeader />
                        <div className="ml-auto">
                          <PostCard.ItemMenu />
                        </div>
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
                        <div className="relative flex">
                          <>
                            <div className="relative mr-2">
                              <>
                                <div className="flex w-10 items-center justify-center rounded-full">
                                  {notification.type === 'like' ? (
                                    <HeartIcon className="h-8 w-8 text-rose-600" />
                                  ) : null}

                                  {notification.type === 'tip' ? (
                                    <BitcoinIcon className="h-8 w-8 text-[#0ac18e] fill-[#0ac18e]" />
                                  ) : null}

                                  {notification.type === 'repost' ? (
                                    <ArrowPathIcon className="h-8 w-8 text-green-600" />
                                  ) : null}

                                  {notification.type === 'follow' ? (
                                    <UserIcon className="h-8 w-8 text-blue-600" />
                                  ) : null}
                                </div>
                              </>
                            </div>
                            <div className="flex flex-col gap-2">
                              <div className="flex flex-row gap-2">
                                {notification.users.map((user) => {
                                  // TODO: show several followers in a row
                                  return (
                                    <Link
                                      onClick={(e) => e.stopPropagation()}
                                      key={user.id}
                                      to={$path('/profile/:username', {
                                        username: user.username,
                                      })}
                                    >
                                      <Avatar
                                        className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-400 ring-8 ring-transparent"
                                        src={user.avatarUrl || ''}
                                        alt=""
                                      />
                                    </Link>
                                  )
                                })}
                              </div>
                              <div>
                                {sourceUsername}
                                {otherUsersBody}
                                {notificationAction}
                                <div>
                                  <span className="text-xs">
                                    {' '}
                                    {moment
                                      .utc(notification.createdAt)
                                      .fromNow()}
                                  </span>
                                </div>
                              </div>
                              {notification.post ? (
                                <div>
                                  <PostProvider item={notification.post}>
                                    <div className="w-full">
                                      <PostCard.Content className="text-gray-400" />
                                    </div>
                                  </PostProvider>
                                </div>
                              ) : null}
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
      </ul>
    </div>
  )
}

const typeToAction: Record<Activity['activity']['type'], string> = {
  //Single or multiple
  // DONATION: 'donated to your campaign',
  follow: 'followed you',
  like: 'liked your post',
  repost: 'reposted your post',
  tip: 'tipped your post',
  //Always single
  mention: 'mentioned you in a post',
  reply: 'replied to your post',
}
