import { CreditCardIcon, EnvelopeIcon } from '@heroicons/react/24/outline'
import { Link } from '@remix-run/react'
import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { usePopper } from 'react-popper'
import { $path } from 'remix-routes'
import { useTypedFetcher } from 'remix-typedjson'
import { Avatar } from '~/components/avatar'
import { loader as apiProfileLoader } from '~/routes/api.profile.($userId)'
import { FollowButton } from './follow-button'

const UserPopoverContext = createContext<{
  setPopperElement: React.Dispatch<React.SetStateAction<HTMLElement | null>>
  setReferenceElement: React.Dispatch<React.SetStateAction<HTMLElement | null>>
  styles: ReturnType<typeof usePopper>['styles']
  attributes: ReturnType<typeof usePopper>['attributes']
} | null>(null)

export function useUserPopover() {
  const value = useContext(UserPopoverContext)
  if (!value)
    throw new Error('Must be child of UserPopoverContext to use this hook!')
  return value
}

export function UserPopoverProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [popperElement, setPopperElement] = useState<HTMLElement | null>(null)
  const [refElement, setReferenceElement] = useState<HTMLElement | null>(null)

  const { styles, attributes } = usePopper(
    refElement,
    popperElement,
    useMemo(() => {
      return {
        placement: 'bottom',
        strategy: 'absolute',
        modifiers: [
          {
            name: 'offset',
            options: {
              offset: [0, 15],
            },
          },
        ],
      }
    }, [])
  )

  const popoverContext = useMemo(() => {
    return {
      setPopperElement,
      setReferenceElement,
      styles,
      attributes,
    }
  }, [setReferenceElement, setPopperElement, styles, attributes])

  return (
    <UserPopoverContext.Provider value={popoverContext}>
      {children}
    </UserPopoverContext.Provider>
  )
}

export function UserPopover({ id }: { id: string }) {
  const fetcher = useTypedFetcher<typeof apiProfileLoader>()

  useEffect(() => {
    fetcher.load(`/api/profile/${id}`)
  }, [id])

  const user = fetcher.data

  return user ? (
    <div onClick={(e) => e.stopPropagation()}>
      <div className="w-[300px]">
        {/* Avatar and edit button */}
        <div className="flex items-start justify-between pb-2">
          <div>
            <Avatar
              className="z-10 w-16 h-16 rounded-full ring-4 ring-white"
              src={user.avatarUrl}
              alt=""
            />
          </div>
          <div className="flex flex-row gap-2 flex-wrap">
            <>
              <button
                type="button"
                className="inline-flex justify-center gap-x-1.5 rounded-md px-3 py-2 text-sm font-semibold text-primary-text shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-hover"
              >
                <CreditCardIcon
                  className="-ml-0.5 h-5 w-5 text-primary-text"
                  aria-hidden="true"
                />
              </button>
              <button
                type="button"
                className="inline-flex justify-center gap-x-1.5 rounded-md px-3 py-2 text-sm font-semibold text-primary-text shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-hover"
              >
                <EnvelopeIcon
                  className="-ml-0.5 h-5 w-5 text-primary-text"
                  aria-hidden="true"
                />
              </button>
              <FollowButton user={user} />
            </>
          </div>
        </div>
        {/* Title, action buttons, header. */}
        <div className="flex flex-col sm:flex-row gap-y-2">
          <div className="min-w-0 flex-1">
            <h1 className="line-clamp-1 text-xl font-bold text-primary-text">
              {user.name}
            </h1>
            <h2 className="line-clamp-1 text-base text-secondary-text">
              @{user.username}
            </h2>
            {!!user.about && (
              <p className="pt-3 text-secondary-text my-1 text-sm whitespace-pre-wrap">
                {user.about}
              </p>
            )}
            <p className="pt-3 text-secondary-text my-1 text-sm flex-row flex items-center gap-x-3 text-center flex-wrap">
              {user.website && (
                <span className="flex flex-row gap-1 items-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="w-4 h-4 sm:w-5 sm:h-5"
                  >
                    <path d="M12.232 4.232a2.5 2.5 0 013.536 3.536l-1.225 1.224a.75.75 0 001.061 1.06l1.224-1.224a4 4 0 00-5.656-5.656l-3 3a4 4 0 00.225 5.865.75.75 0 00.977-1.138 2.5 2.5 0 01-.142-3.667l3-3z" />
                    <path d="M11.603 7.963a.75.75 0 00-.977 1.138 2.5 2.5 0 01.142 3.667l-3 3a2.5 2.5 0 01-3.536-3.536l1.225-1.224a.75.75 0 00-1.061-1.06l-1.224 1.224a4 4 0 105.656 5.656l3-3a4 4 0 00-.225-5.865z" />
                  </svg>
                  <a className="link" target="_blank" href={user.website}>
                    {user.website}
                  </a>
                </span>
              )}
              <span className="flex flex-row gap-1 items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1.5"
                  stroke="currentColor"
                  className="w-4 h-4 sm:w-5 sm:h-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5m-9-6h.008v.008H12v-.008zM12 15h.008v.008H12V15zm0 2.25h.008v.008H12v-.008zM9.75 15h.008v.008H9.75V15zm0 2.25h.008v.008H9.75v-.008zM7.5 15h.008v.008H7.5V15zm0 2.25h.008v.008H7.5v-.008zm6.75-4.5h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V15zm0 2.25h.008v.008h-.008v-.008zm2.25-4.5h.008v.008H16.5v-.008zm0 2.25h.008v.008H16.5V15z"
                  />
                </svg>
                Joined {user.joinedDate}
              </span>
            </p>
            <p className="pt-3 text-secondary-text my-1 text-sm flex-row flex items-center gap-x-6">
              <Link
                className="hover:underline"
                to={$path('/profile/:username/following', {
                  username: user.username,
                })}
              >
                <span className="text-primary-text font-bold">
                  {user.followingCount}
                </span>{' '}
                Following
              </Link>
              <Link
                className="hover:underline"
                to={$path('/profile/:username/followers', {
                  username: user.username,
                })}
              >
                <span className="text-primary-text font-bold">
                  {user.followerCount}
                </span>{' '}
                Followers
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  ) : null
}
