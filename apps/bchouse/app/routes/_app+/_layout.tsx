import { WalletConnectProvider } from '@bchouse/cashconnect'
import { LoaderFunctionArgs } from '@remix-run/node'
import {
  ClientLoaderFunctionArgs,
  Link,
  Outlet,
  useLocation,
  useSearchParams,
} from '@remix-run/react'
import { useMemo } from 'react'
import { getTrpc } from '~/.server/getTrpc'
import InfoAlert from '~/components/alert'
import { AppShell } from '~/components/app-shell'
import { ClientOnly } from '~/components/client-only'
import {
  CurrentUser,
  CurrentUserProvider,
} from '~/components/context/current-user-context'
import { EditProfileModal } from '~/components/edit-profile-modal'
import { ErrorDisplay } from '~/components/pages/error'
import {
  PledgeFundraiserModal,
  PledgeModalProvider,
} from '~/components/pledge-modal'
import { PostModal } from '~/components/post/form/implementations/post-modal'
import { Post } from '~/components/post/types'
import { TipPostModal, TipPostModalProvider } from '~/components/tip-modal'
import { UserPopoverProvider } from '~/components/user-popover'
import { useDismissUpdateProfileBanner } from '~/routes/api+/dismissUpdateProfileBanner'
import { usePageDisplay } from '~/utils/appHooks'
import { classNames } from '~/utils/classNames'
import { trpc } from '~/utils/trpc'
import { useCloseCreatePostModal } from '~/utils/useCloseCreatePostModal'
import { useUpdateLastActive } from '~/utils/useUpdateLastActive'
import { useWalletConnectConfig } from '~/utils/useWalletConnect'

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
  return getTrpc(_, async (trpc) => {
    await trpc.profile.get.prefetch()
  })
}

export const clientLoader = async (_: ClientLoaderFunctionArgs) => {
  return null
}

export const useLayoutLoaderData = () => {
  const { data, error } = trpc.profile.get.useQuery(undefined, {
    staleTime: 5 * 60 * 1000,
  })
  if (!data) throw new Error('Layout loader data error.')
  return data
}

export const useLoggedInLoaderData = () => {
  const { data } = trpc.profile.get.useQuery(undefined, {
    staleTime: 5 * 60 * 1000,
  })
  if (data?.anonymousView) throw new Error('User not signed in')
  return data
}

export const ErrorBoundary = () => {
  const { isLoading, data } = trpc.profile.get.useQuery(undefined, {
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
  let { data } = trpc.profile.get.useQuery(undefined, {
    staleTime: 5 * 60 * 1000,
  })

  const applicationData: CurrentUser =
    !data || data.anonymousView
      ? {
          isAnonymous: true,
          isAdmin: false,
          id: undefined,
          avatarUrl: undefined,
          fullName: undefined,
          username: undefined,
          notificationCount: 0,
        }
      : {
          isAnonymous: false,
          isAdmin: data.profile.isAdmin,
          avatarUrl: data.profile.avatarUrl,
          fullName: data.profile.fullName,
          id: data.profile.id,
          username: data.profile.username,
          notificationCount: data.profile.notificationCount,
        }

  const pageProps = usePageDisplay()

  const config = useWalletConnectConfig()

  const updateProfileFetcher = useDismissUpdateProfileBanner()

  useUpdateLastActive(!applicationData.isAnonymous)

  return (
    <CurrentUserProvider user={applicationData}>
      <WalletConnectProvider config={config}>
        <TipPostModalProvider>
          <PledgeModalProvider>
            <ClientOnly>
              {() =>
                !applicationData.isAnonymous &&
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
            <TipPostModal isLoggedIn={!applicationData.isAnonymous} />
            <PledgeFundraiserModal isLoggedIn={!applicationData.isAnonymous} />

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
    </CurrentUserProvider>
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
  } = trpc.profile.get.useQuery(undefined, {
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
  } = trpc.profile.get.useQuery(undefined, {
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
