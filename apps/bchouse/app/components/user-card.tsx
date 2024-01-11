import { Link, useNavigate } from '@remix-run/react'
import { MouseEventHandler } from 'react'
import { $path } from 'remix-routes'
import { classNames } from '~/utils/classNames'
import { Avatar } from './avatar'
import { FollowButton } from './follow-button'

type BaseUserCardProps = {
  user: {
    avatarUrl: string | null
    id: string
    username: string
    fullName: string | null
    bchAddress: string | null
  }
  containerClass?: string
  children?: React.ReactNode
  header?: React.ReactNode
  onClick?: MouseEventHandler
  noLinks?: boolean
}

type UserCardProps = BaseUserCardProps & {
  user: BaseUserCardProps['user'] & {
    about: string | null
    isCurrentUserFollowing: boolean
    isCurrentUser: boolean
  }
}

export const BaseUserCard: React.FC<BaseUserCardProps> = ({
  user,
  containerClass = 'py-4 px-4',
  children,
  header,
  onClick,
  noLinks = false,
}) => {
  return (
    <div key={user.id} onClick={(e) => e.stopPropagation()}>
      <div className="block hover:bg-hover cursor-pointer" onClick={onClick}>
        <div className={classNames('relative', containerClass)}>
          <div className="relative">
            <div className="relative flex items-start">
              <>
                <div className="relative mr-2">
                  <Avatar
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-400"
                    src={user.avatarUrl || ''}
                    alt=""
                  />
                </div>
                <div className="min-w-0 flex-1 relative">
                  <div className="flex items-center justify-between overflow-hidden w-full">
                    <div className="flex-grow min-w-0 overflow-hidden">
                      <div className="text-[15px]">
                        {noLinks ? (
                          <span className="font-bold text-primary-text hover:underline">
                            {user.fullName || user.username}{' '}
                          </span>
                        ) : (
                          <Link
                            to={$path('/profile/:username', {
                              username: user.username,
                            })}
                            className="font-bold text-primary-text hover:underline"
                          >
                            {user.fullName || user.username}{' '}
                          </Link>
                        )}
                      </div>

                      <div className="-mt-1 overflow-hidden text-ellipsis">
                        {noLinks ? (
                          <span className="text-sm text-secondary-text">
                            @{user.username}
                          </span>
                        ) : (
                          <Link
                            className="text-sm text-secondary-text"
                            to={$path('/profile/:username', {
                              username: user.username,
                            })}
                          >
                            @{user.username}
                          </Link>
                        )}
                      </div>
                    </div>

                    {header}
                  </div>
                  {children}
                </div>
              </>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export const UserCard: React.FC<UserCardProps> = ({
  user,
  containerClass = 'py-4 px-4',
}) => {
  const navigate = useNavigate()

  return (
    <BaseUserCard
      user={user}
      containerClass={containerClass}
      onClick={() => {
        navigate($path('/profile/:username', { username: user.username }))
      }}
      header={
        !user.isCurrentUser ? (
          <div className="ml-auto">
            <FollowButton user={user} />
          </div>
        ) : null
      }
    >
      <div className="mt-2 text-base text-secondary-text whitespace-pre-wrap">
        <p>{user.about}</p>
      </div>
    </BaseUserCard>
  )
}
