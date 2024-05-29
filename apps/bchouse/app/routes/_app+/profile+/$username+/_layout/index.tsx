import { LoaderFunctionArgs } from '@remix-run/node'
import { Outlet } from '@remix-run/react'
import { z } from 'zod'
import { ActionsPanel } from '~/components/actions'
import { StandardLayout } from '~/components/layouts/standard-layout'
import { zx } from '~/utils/zodix'
import { Header } from './header'
// import { QRCode, QRSvg } from 'sexy-qr'
// import QRCode from 'qrcode-svg'
import { $preload } from 'remix-query'
import { ActiveCampaignsWidget } from '~/components/active-campaigns-widget'
import { useCurrentUser } from '~/components/context/current-user-context'
import { ImageGridWidget } from '~/components/image-grid-widget'
import { PostForm } from '~/components/post/form/implementations/post-form'
import { useProfileQuery } from './hooks/useProfileQuery'
import { Tabs } from './tabs'

declare global {
  interface RouteDescription {
    profile: {}
  }
}

interface ProfileHandle extends AppRouteHandle, RouteHandler<'profile'> {}

export const loader = async (_: LoaderFunctionArgs) => {
  const { username } = zx.parseParams(_.params, {
    username: z.string().nonempty(),
  })

  return $preload(_, '/api/profile/getPublicProfile/:username', { username })
}

export const handle: ProfileHandle = {
  id: 'profile',
  preventScrollReset: (previous, current, match) => {
    return previous?.matches.some((r) => r.id === match.id)
  },
  skipScrollRestoration: true,
}

export default function Index() {
  const { data: user } = useProfileQuery()
  const currentUser = useCurrentUser()

  if (!user) return null

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
              <Header />
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
                        <Tabs />
                      </div>
                    </div>
                  </div>
                </div>
              </section>
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
          <ActionsPanel actions={[]} />
        </div>
      }
      widgets={[
        <ImageGridWidget
          images={user.mediaPreviewItems}
          username={user.username}
        />,
        <ActiveCampaignsWidget username={user.username} />,
        // <RelatedFollowSuggestions user={user.id} />,
      ]}
    ></StandardLayout>
  )
}
