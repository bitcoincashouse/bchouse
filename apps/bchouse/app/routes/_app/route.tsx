import { WalletConnectProvider } from '@bchouse/cashconnect'
import { logger } from '@bchouse/utils'
import { LoaderFunctionArgs } from '@remix-run/node'
import { Link, Outlet, useLocation, useSearchParams } from '@remix-run/react'
import { useMemo } from 'react'
import InfoAlert from '~/components/alert'
import { ClientOnly } from '~/components/client-only'
import { EditProfileModal } from '~/components/edit-profile-modal'
import { ErrorDisplay } from '~/components/pages/error'
import {
  PledgeFundraiserModal,
  PledgeModalProvider,
} from '~/components/pledge-modal'
import { PostModal } from '~/components/post/post-modal'
import { Post } from '~/components/post/types'
import { TipPostModal, TipPostModalProvider } from '~/components/tip-modal'
import { UserPopoverProvider } from '~/components/user-popover'
import { usePageDisplay } from '~/utils/appHooks'
import { classNames } from '~/utils/classNames'
import { getServerClient } from '~/utils/trpc.server'
import { useCloseCreatePostModal } from '~/utils/useCloseCreatePostModal'
import { useWalletConnectConfig } from '~/utils/useWalletConnect'
import { trpc } from '../../utils/trpc'
import { useUpdateLastActive } from '../../utils/useUpdateLastActive'
import { useDismissUpdateProfileBanner } from '../api.dismissUpdateProfileBanner'
import { AppShell } from './app-shell'

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

//@ts-ignore
export const loader = async (_: LoaderFunctionArgs) => {
  try {
    const trpc = getServerClient(_.request)
    await trpc.profile.prefetch()

    return {
      dehydratedState: trpc.dehydrate(),
    }
  } catch (err) {
    logger.info('Error fetching app shell')
    throw err
  }
}

export const useLayoutLoaderData = () => {
  const { data, error } = trpc.profile.useQuery(undefined, {
    staleTime: 5 * 60 * 1000,
  })
  if (!data) throw new Error('Layout loader data error.')
  return data
}

export const useLoggedInLoaderData = () => {
  const { data } = trpc.profile.useQuery(undefined, {
    staleTime: 5 * 60 * 1000,
  })
  if (data?.anonymousView) throw new Error('User not signed in')
  return data
}

export const ErrorBoundary = () => {
  const { isLoading, data } = trpc.profile.useQuery(undefined, {
    staleTime: 5 * 60 * 1000,
  })

  return !data ? (
    <div>Sorry, something went wrong</div>
  ) : (
    <AppShell showHeader={false} {...data}>
      <div>
        <ErrorDisplay page="__index" />
      </div>
    </AppShell>
  )
}

export default function Index() {
  let {
    data: applicationData = {
      anonymousView: true,
    },
  } = trpc.profile.useQuery(undefined, {
    staleTime: 5 * 60 * 1000,
  })

  const pageProps = usePageDisplay()

  const config = useWalletConnectConfig()

  const updateProfileFetcher = useDismissUpdateProfileBanner()

  useUpdateLastActive(!applicationData.anonymousView)

  return (
    <WalletConnectProvider config={config}>
      <TipPostModalProvider>
        <PledgeModalProvider>
          <ClientOnly>
            {() =>
              !applicationData.anonymousView &&
              applicationData.showUpdateProfile ? (
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
          <TipPostModal isLoggedIn={!applicationData.anonymousView} />
          <PledgeFundraiserModal isLoggedIn={!applicationData.anonymousView} />

          <AppShell {...applicationData} showHeader={pageProps.header}>
            <section className={classNames('relative admin-outlet')}>
              <div>
                <div>
                  <HeaderSection />
                  {/* Body */}
                  <div>
                    <UserPopoverProvider>
                      <Outlet />
                    </UserPopoverProvider>
                  </div>
                </div>

                <FooterSection />
                <ModalSection />
              </div>
            </section>
          </AppShell>
        </PledgeModalProvider>
      </TipPostModalProvider>
    </WalletConnectProvider>
  )
}

function HeaderSection() {
  const pageProps = usePageDisplay()

  return (
    <>
      {/* Header */}
      {pageProps.header && pageProps.title && (
        <header className="pt-16 pb-12 w-full">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold tracking-tight">
              {pageProps.title}
            </h1>
          </div>
        </header>
      )}
    </>
  )
}

function ModalSection() {
  return (
    <>
      <ShowPostModal />
      <ShowEditProfileModal />
    </>
  )
}

function ShowPostModal() {
  let {
    data: applicationData = {
      anonymousView: true,
    },
  } = trpc.profile.useQuery(undefined, {
    staleTime: 5 * 60 * 1000,
  })
  const [searchParams] = useSearchParams()
  const modalName = searchParams.get('modal')
  const replyToPost = useLocation().state?.replyToPost as Post
  const closePostModal = useCloseCreatePostModal()

  const showCreatePost = useMemo(() => {
    if (['create-post', 'reply'].indexOf(modalName as string) === -1) {
      return false
    }

    if (modalName === 'reply' && !replyToPost) {
      closePostModal()
      return false
    }

    return true
  }, [modalName, replyToPost])

  if (applicationData.anonymousView || !showCreatePost) {
    return null
  }

  const profile = applicationData.profile

  return (
    <ClientOnly>
      {() => (
        <PostModal
          isOpen={true}
          onClose={() => closePostModal()}
          user={profile}
          parentPost={replyToPost}
        />
      )}
    </ClientOnly>
  )
}

function ShowEditProfileModal() {
  let {
    data: applicationData = {
      anonymousView: true,
    },
  } = trpc.profile.useQuery(undefined, {
    staleTime: 5 * 60 * 1000,
  })

  const closeEditProfileModal = useCloseCreatePostModal()
  const [searchParams] = useSearchParams()
  const modalName = searchParams.get('modal')

  if (
    applicationData.anonymousView ||
    (!applicationData.showOnBoarding && modalName !== 'edit-profile')
  ) {
    return null
  }

  return (
    <EditProfileModal
      open={true}
      closeModal={closeEditProfileModal}
      user={applicationData.homeView}
    />
  )
}

function FooterSection() {
  const pageProps = usePageDisplay()

  return (
    <>
      {pageProps.showFooter && (
        <footer className="flex items-center min-h-[110px] justify-center pt-[33vh] pb-10 center grass">
          <p>
            Powered by{' '}
            <a
              className="text-blue-600"
              href="https://cashscript.org"
              target="_blank"
            >
              CashScript
            </a>
          </p>
        </footer>
      )}
    </>
  )
}
