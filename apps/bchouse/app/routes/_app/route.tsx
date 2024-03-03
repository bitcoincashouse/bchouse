import type { ProfileService } from '@bchouse/api/src/services/services/profile'
import { WalletConnectProvider } from '@bchouse/cashconnect'
import { LoaderFunctionArgs } from '@remix-run/node'
import {
  Link,
  Outlet,
  ShouldRevalidateFunctionArgs,
  useLocation,
  useSearchParams,
} from '@remix-run/react'
import { useMemo } from 'react'
import {
  TypedJsonResponse,
  typedjson,
  useTypedLoaderData,
} from 'remix-typedjson'
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
import { useAppLoaderData, usePageDisplay } from '~/utils/appHooks'
import { classNames } from '~/utils/classNames'
import { getUpdateProfileSession } from '~/utils/updateProfileBannerCookie.server'
import { useCloseCreatePostModal } from '~/utils/useCloseCreatePostModal'
import { useWalletConnectConfig } from '~/utils/useWalletConnect'
import { useDismissUpdateProfileBanner } from '../api.dismissUpdateProfileBanner'
import { useUpdateLastActive } from '../api.update-last-active'
import { AppShell } from './app-shell'

declare global {
  interface RouteDescription {
    layout: {
      data: typeof loader
    }
  }
}

type SignedInLoaderData = {
  anonymousView: false
  showUpdateProfile: boolean
} & Awaited<ReturnType<ProfileService['getHomeProfile']>>
type AnonymousLoaderData = { anonymousView: true }
type LoaderData = AnonymousLoaderData | SignedInLoaderData

export type LayoutLoaderData = LoaderData

export const handle: RouteHandler<'layout'> = {
  id: 'layout',
}

export const layoutHandle = handle

export const loader = async (
  _: LoaderFunctionArgs
): Promise<TypedJsonResponse<LoaderData>> => {
  //Applies to entire application
  await _.context.ratelimit.limitByIp(_, 'app', true)

  const { userId } = await _.context.authService.getAuthOptional(_)
  const profile =
    !!userId && (await _.context.profileService.getHomeProfile(userId))
  const updateProfileSession = await getUpdateProfileSession(_.request)

  if (!profile) {
    return typedjson({
      anonymousView: true,
      showUpdateProfile: false,
    })
  } else {
    return typedjson({
      ...profile,
      anonymousView: false,
      showUpdateProfile:
        !profile.homeView.bchAddress && !updateProfileSession.getDismissed(),
    })
  }
}

export function shouldRevalidate({
  currentUrl,
  nextUrl,
  defaultShouldRevalidate,
}: ShouldRevalidateFunctionArgs) {
  return (
    currentUrl.pathname === '/' ||
    nextUrl.pathname === '/' ||
    defaultShouldRevalidate
  )
}

export const useLayoutLoaderData = () => {
  const data = useAppLoaderData(layoutHandle)
  if (!data) throw new Error('Layout loader data error.')
  return data
}

export const useLoggedInLoaderData = () => {
  const data = useAppLoaderData(layoutHandle)
  if (data?.anonymousView) throw new Error('User not signed in')
  return data
}

export const ErrorBoundary = () => {
  const appData = useAppLoaderData(layoutHandle)

  return (
    <AppShell showHeader={false} {...appData}>
      <div>
        <ErrorDisplay page="__index" />
      </div>
    </AppShell>
  )
}

export default function Index() {
  const applicationData = useTypedLoaderData<typeof loader>()
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
  const applicationData = useTypedLoaderData<typeof loader>()
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

  return (
    <ClientOnly>
      {() => (
        <PostModal
          isOpen={true}
          onClose={() => closePostModal()}
          user={applicationData.profile}
          parentPost={replyToPost}
        />
      )}
    </ClientOnly>
  )
}

function ShowEditProfileModal() {
  const applicationData = useTypedLoaderData<typeof loader>()
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
