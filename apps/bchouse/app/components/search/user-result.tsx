import { $path } from 'remix-routes'
import { classNames } from '~/utils/classNames'
import { Avatar } from '../avatar'

type UserResultProps = {
  user: {
    avatarUrl: string | undefined
    id: string
    username: string
    fullName: string | null
    about: string | null
    bchAddress: string | null
    isCurrentUserFollowing: number | boolean
  }
}

export const UserResult: React.FC<UserResultProps> = ({ user }) => {
  return (
    <div key={user.id}>
      <div className="block cursor-pointer">
        <div className={classNames('relative p-2')}>
          <div className="relative">
            <div className="relative flex items-start">
              <>
                <div className="relative mr-4">
                  <Avatar
                    className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-400"
                    src={user.avatarUrl || ''}
                    alt=""
                  />
                </div>
                <div className="min-w-0 flex-1 relative">
                  <div className="flex items-center">
                    <div className="flex flex-col gap-2">
                      <div className="text-[15px]">
                        <div className="font-bold text-primary-text">
                          {user.fullName}{' '}
                        </div>
                      </div>

                      <div className="-mt-1">
                        <a
                          className="text-sm text-secondary-text"
                          href={$path('/profile/:username', {
                            username: user.username,
                          })}
                          onClick={(e) => e.preventDefault()}
                        >
                          @{user.username}
                        </a>
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 text-base text-gray-700 whitespace-pre-wrap">
                    <p>{user.about}</p>
                  </div>
                </div>
              </>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
