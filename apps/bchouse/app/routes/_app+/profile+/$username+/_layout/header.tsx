import { $path } from 'remix-routes'
// import { QRCode, QRSvg } from 'sexy-qr'
import {
  CreditCardIcon,
  EnvelopeIcon,
  PencilIcon,
} from '@heroicons/react/24/outline'
import { Link } from '@remix-run/react'
// import QRCode from 'qrcode-svg'
import { Avatar } from '~/components/avatar'
import { FollowButton } from '~/components/follow-button'
import { ImageProxy } from '~/components/image-proxy'
import { useProfileQuery } from './hooks/useProfileQuery'

export function Header() {
  const { data: user } = useProfileQuery()
  if (!user) return null

  return (
    <>
      {/* Profile header */}
      <div>
        <div>
          <div className="aspect-[9/3] relative overflow-hidden">
            {user.backgroundImage ? (
              <ImageProxy
                id={'coverPhoto_upload' + '__preview'}
                className="aspect-[9/3] h-full w-full object-cover"
                // TODO: load appropriate image size
                // Desktop: 600px,
                // Mobile: < 600px,
                mediaKey={user.backgroundImage}
                quality={100}
                width={600}
                aspectRatio="9:3"
                alt=""
              />
            ) : null}
          </div>
        </div>
        <div className="pt-2 lg:px-8 max-w-5xl mx-auto pb-4 px-4 sm:px-6">
          {/* Avatar and edit button */}
          <div className="flex items-start justify-between flex-wrap">
            <div className="-mt-[15%] z-20 mb-2 w-1/4 max-w-[8rem] ">
              <div>
                <Avatar
                  className="z-10 rounded-full ring-4 ring-white w-full"
                  src={user.avatarUrl}
                  alt=""
                />
              </div>
            </div>
            <div className="flex flex-row gap-2 flex-wrap">
              {user.isCurrentUser ? (
                <div className="">
                  <Link
                    to={{ search: '?modal=edit-profile' }}
                    replace={true}
                    preventScrollReset={true}
                    type="button"
                    className="inline-flex justify-center gap-x-1.5 rounded-md px-3 py-2 text-sm font-semibold text-primary-text shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-hover"
                  >
                    <PencilIcon className="inline h-4 w-4" aria-hidden="true" />{' '}
                    Edit
                  </Link>
                </div>
              ) : (
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
              )}
            </div>
          </div>
          {/* Title, action buttons, header. */}
          <div className="flex flex-col sm:flex-row gap-y-2">
            <div className="min-w-0 flex-1">
              <h1 className="line-clamp-1 text-xl font-bold text-primary-text">
                {user.fullName}
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
    </>
  )
}
