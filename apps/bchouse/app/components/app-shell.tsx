import { useWalletConnect } from '@bchouse/cashconnect'
import {
  BellIcon as BellIconSolid,
  GlobeAltIcon as GlobeAltIconSolid,
  HomeIcon as HomeIconSolid,
  MagnifyingGlassIcon as MagnifyingGlassIconSolid,
  ShoppingBagIcon as ShoppingBagIconSolid,
  ShoppingCartIcon as ShoppingCartIconSolid,
  UserGroupIcon as UserGroupIconSolid,
  UserIcon as UserIconSolid,
  WalletIcon as WalletIconSolid,
} from '@heroicons/react/20/solid'
import {
  BellIcon,
  GlobeAltIcon,
  HomeIcon,
  MagnifyingGlassIcon,
  ShoppingBagIcon,
  ShoppingCartIcon,
  UserGroupIcon,
  UserIcon,
  WalletIcon,
} from '@heroicons/react/24/outline'
import { useMemo } from 'react'
import ReactDOM from 'react-dom'
import { $path } from 'remix-routes' // <-- Import magical $path helper from remix-routes.
import { ClientOnly } from '~/components/client-only'
import { MobileMenuProvider } from '~/components/mobile-menu-provider'
import { MobileHeaderNavigation } from '~/components/navigation/mobile-header-navigation'
import { MobileNavigation } from '~/components/navigation/mobile-navigation'
import SidebarNavigation, {
  NavigationItemProps,
} from '~/components/navigation/sidebar-navigation'
import { classnames } from '~/components/utils/classnames'
import { usePageDisplay } from '~/utils/appHooks'
import { logoUrl } from '~/utils/constants'
import { ConnectWalletModal } from './connect-modal'
import { useCurrentUser } from './context/current-user-context'
import { useWalletConnectSession } from './utils/wc2-provider'

const openWalletConnect = () => {}

export const AppShell: React.FC<
  React.PropsWithChildren & { showHeader: boolean }
> = function ({ children, showHeader }) {
  const currentUser = useCurrentUser()
  //TODO: Only open WC2 wallets and only allow WC2 connections
  const { setReferenceElement, close: closeWalletConnect } = useWalletConnect()

  const {
    session,
    setSession,
    open: openWalletConnect,
    setOpen: setOpenWalletConnect,
  } = useWalletConnectSession()

  const userNavigation = useMemo(
    () =>
      [
        {
          name: 'Home',
          href: currentUser.isAnonymous ? $path('/home/all') : $path('/home'),
          icon: HomeIcon,
          activeIcon: HomeIconSolid,
          mobile: true,
        },
        {
          name: 'Search',
          href: $path('/explore'),
          icon: MagnifyingGlassIcon,
          activeIcon: MagnifyingGlassIconSolid,
          mobile: true,
        },
        {
          name: 'Notifications',
          href: currentUser.isAnonymous
            ? $path('/auth/login/:rest?', {})
            : $path('/notifications'),
          icon: BellIcon,
          activeIcon: BellIconSolid,
          mobile: true,
          notificationCount: currentUser.isAnonymous
            ? 0
            : currentUser.notificationCount,
        },
        {
          name: 'Profile',
          href: currentUser.isAnonymous
            ? $path('/auth/login/:rest?', {})
            : $path('/profile/:username', {
                username: currentUser.username,
              }),
          icon: UserIcon,
          activeIcon: UserIconSolid,
          mobile: true,
        },
        {
          name: 'Campaigns',
          href: $path('/campaigns'),
          icon: ShoppingBagIcon,
          activeIcon: ShoppingBagIconSolid,
          mobile: false,
        },
        {
          name: 'Pledges',
          href: $path('/manage/pledges'),
          icon: ShoppingCartIcon,
          activeIcon: ShoppingCartIconSolid,
          mobile: false,
        },
        {
          name: 'BCH Ecosystem',
          href: $path('/ecosystem/:tab?', {}),
          icon: GlobeAltIcon,
          activeIcon: GlobeAltIconSolid,
          mobile: false,
        },
        {
          name: 'Invite',
          href: currentUser.isAnonymous
            ? $path('/auth/login/:rest?', {})
            : $path('/invite'),
          icon: UserGroupIcon,
          activeIcon: UserGroupIconSolid,
          mobile: false,
        },
        {
          name: session ? 'Wallet Connected' : 'Connect Wallet',
          onClick: async () => {
            setOpenWalletConnect(true)
          },
          icon: session
            ? () => (
                <span className="text-green-500 w-8 text-3xl animate-pulse">
                  •
                </span>
              )
            : WalletIcon,
          activeIcon: WalletIconSolid,
          mobile: true,
        },
      ] as NavigationItemProps[],
    [currentUser, session, setOpenWalletConnect]
  )

  const { containerClassName } = usePageDisplay()

  return (
    <MobileMenuProvider>
      <div className="app-container relative flex flex-col h-screen min-h-screen sm:h-auto">
        {/* Fixed position and invisible copy to offset body container */}
        <div className="non-mobile:hidden invisible">
          <MobileHeaderNavigation logoUrl={logoUrl} />
        </div>
        <div className="non-mobile:hidden absolute top-0 w-full z-40">
          <MobileHeaderNavigation
            logoUrl={logoUrl}
            navigation={userNavigation}
          />
        </div>

        {!!showHeader && (
          <div className={`absolute top-0 left-0 right-0 h-64`}></div>
        )}

        <div
          className={classnames('sidebar-container flex', containerClassName)}
        >
          <div className="hidden non-mobile:flex flex-col items-end relative flex-grow">
            <div className="w-[88px] xl:w-[275px]">
              <div className="fixed w-[88px] xl:w-[275px] h-full flex pt-4 xl:pt-0">
                <SidebarNavigation
                  navigation={userNavigation}
                  logoUrl={logoUrl}
                />
              </div>
            </div>
          </div>

          <div id="view" className="relative flex-grow">
            <div className="relative flex-grow w-full min-[720px]:w-[600px] min-[990px]:w-[920px] min-[1080px]:w-[990px]">
              {children}
              {openWalletConnect ? (
                <ConnectWalletModal
                  ref={(ref) => setReferenceElement(ref)}
                  isLoggedIn={!currentUser.isAnonymous}
                  session={session}
                  setSession={(context) => {
                    setSession(context.session || null)
                  }}
                  onClose={async () => {
                    await closeWalletConnect()
                    setOpenWalletConnect(false)
                  }}
                />
              ) : null}
            </div>
          </div>
        </div>

        {/* Fixed position and invisible copy to offset body container */}
        {!currentUser.isAnonymous && (
          <ClientOnly>
            {() =>
              ReactDOM.createPortal(
                <>
                  <div className="non-mobile:hidden fixed inset-x-0 bottom-0 translate-z-[1]">
                    <MobileNavigation navigation={userNavigation} />
                  </div>
                </>,
                document.querySelector('#app') as HTMLDivElement
              )
            }
          </ClientOnly>
        )}
      </div>
    </MobileMenuProvider>
  )
}
