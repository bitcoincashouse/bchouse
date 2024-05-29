import { LoaderFunctionArgs } from '@remix-run/node'
import {
  ClientLoaderFunctionArgs,
  NavLink,
  Outlet,
  useParams,
} from '@remix-run/react'
import { $path } from 'remix-routes'
import { z } from 'zod'
import { ActionsPanel } from '~/components/actions'
import { StandardLayout } from '~/components/layouts/standard-layout'
import { classNames } from '~/utils/classNames'
import { zx } from '~/utils/zodix'
// import { QRCode, QRSvg } from 'sexy-qr'
import {
  CreditCardIcon,
  EnvelopeIcon,
  PencilIcon,
} from '@heroicons/react/24/outline'
import { Link } from '@remix-run/react'
// import QRCode from 'qrcode-svg'
import { $preload, $useLoaderQuery } from 'remix-query'
import { ActiveCampaignsWidget } from '~/components/active-campaigns-widget'
import { Avatar } from '~/components/avatar'
import { useCurrentUser } from '~/components/context/current-user-context'
import { FollowButton } from '~/components/follow-button'
import { ImageGridWidget } from '~/components/image-grid-widget'
import { ImageProxy } from '~/components/image-proxy'
import { PostForm } from '~/components/post/form/implementations/post-form'

declare global {
  interface RouteDescription {
    profile: {}
  }
}

export const loader = async (_: LoaderFunctionArgs) => {
  const { username } = zx.parseParams(_.params, {
    username: z.string().nonempty(),
  })

  return $preload(_, '/api/profile/getPublicProfile/:username', { username })
}

export const clientLoader = async (_: ClientLoaderFunctionArgs) => {
  const { username } = zx.parseParams(_.params, {
    username: z.string(),
  })

  debugger
  return await _.serverLoader()
}

interface ProfileHandle extends AppRouteHandle, RouteHandler<'profile'> {}

export const handle: ProfileHandle = {
  id: 'profile',
  preventScrollReset: (previous, current, match) => {
    return previous?.matches.some((r) => r.id === match.id)
  },
  skipScrollRestoration: true,
}

export const profileHandle = handle

const bchLogo = `<?xml version="1.0" encoding="utf-8"?>
<svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
viewBox="0 0 788 788" style="enable-background:new 0 0 788 788;" xml:space="preserve">
<defs>
   <radialGradient id="rgrad" cx="0%" cy="100%" r="120.71067811865476%" >
    
            <stop offset="0%" style="stop-color:rgb(10,193,142);stop-opacity:1.00" />
            <stop offset="89%" style="stop-color:rgb(10,193,142);stop-opacity:0.72" />
            <stop offset="100%" style="stop-color:rgb(10,193,142);stop-opacity:0.66" />

    </radialGradient>
</defs>
<style type="text/css">
	.st0{fill:url(#rgrad);}
	.st1{fill:#FFFFFF;}
</style>
<circle class="st0" cx="394" cy="394" r="394"/>
<path id="symbol_1_" class="st1" d="M516.9,261.7c-19.8-44.9-65.3-54.5-121-45.2L378,147.1L335.8,158l17.6,69.2
	c-11.1,2.8-22.5,5.2-33.8,8.4L302,166.8l-42.2,10.9l17.9,69.4c-9.1,2.6-85.2,22.1-85.2,22.1l11.6,45.2c0,0,31-8.7,30.7-8
	c17.2-4.5,25.3,4.1,29.1,12.2l49.2,190.2c0.6,5.5-0.4,14.9-12.2,18.1c0.7,0.4-30.7,7.9-30.7,7.9l4.6,52.7c0,0,75.4-19.3,85.3-21.8
	l18.1,70.2l42.2-10.9l-18.1-70.7c11.6-2.7,22.9-5.5,33.9-8.4l18,70.3l42.2-10.9l-18.1-70.1c65-15.8,110.9-56.8,101.5-119.5
	c-6-37.8-47.3-68.8-81.6-72.3C519.3,324.7,530,297.4,516.9,261.7L516.9,261.7z M496.6,427.2c8.4,62.1-77.9,69.7-106.4,77.2
	l-24.8-92.9C394,404,482.4,372.5,496.6,427.2z M444.6,300.7c8.9,55.2-64.9,61.6-88.7,67.7l-22.6-84.3
	C357.2,278.2,426.5,249.6,444.6,300.7z"/>
</svg>`

export type User = Extract<
  Awaited<ReturnType<typeof loader>>,
  { isLandingPage: false }
>

export const useProfileLoader = () => {
  const username = useParams()?.username as string

  const { data: user } = $useLoaderQuery(
    '/api/profile/getPublicProfile/:username',
    {
      params: {
        username,
      },
      staleTime: 5 * 60 * 1000,
      gcTime: 15 * 60 * 1000,
    }
  )

  return user
}

function randomInteger(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

const tabs = [
  { name: 'Posts', href: '' },
  { name: 'Replies', href: 'replies' },
  { name: 'Media', href: 'media' },
  { name: 'Likes', href: 'likes' },
  { name: 'Campaigns', href: 'campaigns' },
]

export default function Index() {
  const user = useProfileLoader()
  const currentUser = useCurrentUser()

  if (!user) {
    return null
  }

  return (
    <StandardLayout
      title={user.name}
      header={null}
      main={
        <div className="flex flex-col gap-6">
          <h1 className="sr-only">Profile</h1>
          {/* Welcome panel */}
          <div className="relative z-0 flex-1 focus:outline-none">
            <article className="max-w-5xl mx-auto">
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
                              <PencilIcon
                                className="inline h-4 w-4"
                                aria-hidden="true"
                              />{' '}
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
                              <a
                                className="link"
                                target="_blank"
                                href={user.website}
                              >
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
              <section aria-labelledby="profile-overview-title">
                <div className="overflow-hidden">
                  <h2 className="sr-only" id="profile-overview-title">
                    Profile Overview
                  </h2>
                </div>
              </section>
              {/* Description list*/}
              <section
                aria-labelledby="applicant-information-title"
                className="border-b border-gray-100 dark:border-gray-600 max-w-full overflow-x-auto"
              >
                <div>
                  <div className="px-4 sm:px-6">
                    <div className="overflow-x-auto h-full overflow-y-hidden">
                      <div className="flex mx-auto max-w-5xl">
                        <nav
                          className={classNames(
                            'flex justify-around space-x-8 flex-1'
                          )}
                          aria-label="Tabs"
                        >
                          {tabs.map((tab, i) => {
                            return (
                              <NavLink
                                key={tab.name}
                                to={tab.href}
                                end
                                replace={true}
                                preventScrollReset={true}
                                className={({ isActive }) =>
                                  classNames(
                                    isActive
                                      ? 'border-pink-500 text-primary-text'
                                      : 'border-transparent text-secondary-text hover:border-gray-300 hover:dark:text-secondary-text',
                                    'whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium'
                                  )
                                }
                              >
                                {tab.name}
                              </NavLink>
                            )
                          })}
                        </nav>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
              {/* <>
                {user.svg ? (
                  <svg
                    className="flex p-4 sm:hidden"
                    dangerouslySetInnerHTML={{ __html: user.svg }}
                  ></svg>
                ) : null}
              </> */}
              {!currentUser.isAnonymous && user.id === currentUser.id ? (
                <div className="hidden sm:block border-b border-gray-100 dark:border-gray-600 px-4 py-6 sm:px-6">
                  <PostForm
                    showAudience
                    key={user.id}
                    placeholder="What's building?"
                    formClassName="flex !flex-col"
                  />
                </div>
              ) : null}
              <div className="min-h-[1500px]">
                <Outlet />
              </div>
            </article>
          </div>
          {/* Actions panel */}
          <ActionsPanel actions={[]} />
        </div>
      }
      widgets={[
        user.mediaPreviewItems.length > 0 ? (
          <ImageGridWidget
            images={user.mediaPreviewItems}
            username={user.username}
          />
        ) : null,
        <ActiveCampaignsWidget username={user.username} />,
        // <RelatedFollowSuggestions user={user.id} />,
      ]}
    ></StandardLayout>
  )
}
