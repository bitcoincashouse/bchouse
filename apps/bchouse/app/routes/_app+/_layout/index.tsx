import { WalletConnectProvider } from '@bchouse/cashconnect'
import { LoaderFunctionArgs } from '@remix-run/node'
import { ClientLoaderFunctionArgs, Link, Outlet } from '@remix-run/react'
import { $preload } from 'remix-query'
import InfoAlert from '~/components/alert'
import { AppShell } from '~/components/app-shell'
import { ClientOnly } from '~/components/client-only'
import { CurrentUserProvider } from '~/components/context/current-user-context'
import { ErrorDisplay } from '~/components/pages/error'
import {
  PledgeFundraiserModal,
  PledgeModalProvider,
} from '~/components/pledge-modal'
import { TipPostModal, TipPostModalProvider } from '~/components/tip-modal'
import { UserPopoverProvider } from '~/components/user-popover'
import { useDismissUpdateProfileBanner } from '~/routes/api+/dismissUpdateProfileBanner'
import { usePageDisplay } from '~/utils/appHooks'
import { classNames } from '~/utils/classNames'
import { useUpdateLastActive } from '~/utils/useUpdateLastActive'
import { useWalletConnectConfig } from '~/utils/useWalletConnect'
import { Footer } from './footer'
import { Header } from './header'
import { useProfileQuery } from './hooks/useProfileQuery'
import { ShowPostModal } from './modals/post-modal'
import { ShowEditProfileModal } from './modals/show-edit-profile-modal'

declare global {
  interface RouteDescription {
    layout: {
      data: typeof loader
    }
  }
}

export const handle: RouteHandler<'layout'> = {
  id: 'layout',
}

export const layoutHandle = handle

export const loader = async (_: LoaderFunctionArgs) => {
  return $preload(_, '/api/profile/get')
}

export const clientLoader = async (_: ClientLoaderFunctionArgs) => {
  return null
}

export const ErrorBoundary = () => {
  const currentUser = useProfileQuery()
  const config = useWalletConnectConfig()

  return (
    <CurrentUserProvider user={currentUser}>
      <WalletConnectProvider config={config}>
        <AppShell showHeader={false}>
          <div>
            <ErrorDisplay page="__index" />
          </div>
        </AppShell>
      </WalletConnectProvider>
    </CurrentUserProvider>
  )
}

export default function Index() {
  const currentUser = useProfileQuery()
  const pageProps = usePageDisplay()
  const config = useWalletConnectConfig()
  const updateProfileFetcher = useDismissUpdateProfileBanner()

  useUpdateLastActive(!currentUser.isAnonymous)

  return (
    <CurrentUserProvider user={currentUser}>
      <WalletConnectProvider config={config}>
        <TipPostModalProvider>
          <PledgeModalProvider>
            <ClientOnly>
              {() =>
                !currentUser.isAnonymous && currentUser.showUpdateProfile ? (
                  <InfoAlert
                    target="_blank"
                    onDismiss={updateProfileFetcher.submit}
                  >
                    <span>
                      Your profile is missing a BCH address.{' '}
                      <Link
                        className="underline"
                        to={{ search: 'modal=edit-profile' }}
                      >
                        Click here
                      </Link>{' '}
                      to update.
                    </span>
                  </InfoAlert>
                ) : null
              }
            </ClientOnly>
            <TipPostModal isLoggedIn={!currentUser.isAnonymous} />
            <PledgeFundraiserModal isLoggedIn={!currentUser.isAnonymous} />

            <AppShell showHeader={pageProps.header}>
              <section className={classNames('relative admin-outlet')}>
                <div>
                  <div>
                    <Header />
                    {/* Body */}
                    <div>
                      <UserPopoverProvider>
                        <Outlet />
                      </UserPopoverProvider>
                    </div>
                  </div>

                  <Footer />
                  <ShowPostModal />
                  <ShowEditProfileModal />
                </div>
              </section>
            </AppShell>
          </PledgeModalProvider>
        </TipPostModalProvider>
      </WalletConnectProvider>
    </CurrentUserProvider>
  )
}
