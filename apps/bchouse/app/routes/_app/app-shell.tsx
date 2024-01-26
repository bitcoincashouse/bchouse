import {
  BellIcon as BellIconSolid,
  GlobeAltIcon as GlobeAltIconSolid,
  HomeIcon as HomeIconSolid,
  MagnifyingGlassIcon as MagnifyingGlassIconSolid,
  ShoppingBagIcon as ShoppingBagIconSolid,
  ShoppingCartIcon as ShoppingCartIconSolid,
  UserGroupIcon as UserGroupIconSolid,
  UserIcon as UserIconSolid,
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
} from '@heroicons/react/24/outline'
import { Outlet } from '@remix-run/react'
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
import { PledgeFundraiserModal } from '~/components/pledge-modal'
import { TipPostModal } from '~/components/tip-modal'
import { classnames } from '~/components/utils/classnames'
import { usePageDisplay } from '~/utils/appHooks'
import { logoUrl } from '~/utils/constants'
import { LayoutLoaderData } from './route'

export const AppShell: React.FC<
  React.PropsWithChildren & LayoutLoaderData & { showHeader: boolean }
> = function ({ children, showHeader, ...layoutData }) {
  const userNavigation = useMemo(
    () =>
      [
        {
          name: 'Home',
          href: layoutData.anonymousView ? $path('/home/all') : $path('/home'),
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
          href: layoutData.anonymousView
            ? $path('/auth/login/:rest?', {})
            : $path('/notifications'),
          icon: BellIcon,
          activeIcon: BellIconSolid,
          mobile: true,
          notificationCount: layoutData.anonymousView
            ? 0
            : layoutData.profile.notificationCount,
        },
        {
          name: 'Profile',
          href: layoutData.anonymousView
            ? $path('/auth/login/:rest?', {})
            : $path('/profile/:username', {
                username: layoutData.profile.username,
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
          href: layoutData.anonymousView
            ? $path('/auth/login/:rest?', {})
            : $path('/invite'),
          icon: UserGroupIcon,
          activeIcon: UserGroupIconSolid,
          mobile: false,
        },
      ] as NavigationItemProps[],
    [layoutData]
  )

  const { containerClassName } = usePageDisplay()

  if (layoutData.landingPage) {
    return (
      <div>
        <Outlet />
      </div>
    )
  }

  return (
    <MobileMenuProvider>
      <div className="app-container relative flex flex-col h-screen min-h-screen sm:h-auto">
        {/* Fixed position and invisible copy to offset body container */}
        <div className="non-mobile:hidden invisible">
          <MobileHeaderNavigation logoUrl={logoUrl} {...layoutData} />
        </div>
        <div className="non-mobile:hidden absolute top-0 w-full z-40">
          <MobileHeaderNavigation
            logoUrl={logoUrl}
            navigation={userNavigation}
            {...layoutData}
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
                  {...layoutData}
                  navigation={userNavigation}
                  logoUrl={logoUrl}
                />
              </div>
            </div>
          </div>

          <div id="view" className="relative flex-grow">
            {children}
          </div>
        </div>

        <TipPostModal isLoggedIn={!layoutData.anonymousView} />
        <PledgeFundraiserModal isLoggedIn={!layoutData.anonymousView} />

        {/* Fixed position and invisible copy to offset body container */}
        {!layoutData.anonymousView && (
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
