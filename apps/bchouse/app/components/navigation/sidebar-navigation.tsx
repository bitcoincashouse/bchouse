import { SignInButton, UserButton } from '@clerk/remix'
import { Menu } from '@headlessui/react'
import { Link, NavLink, useLocation } from '@remix-run/react'
import React, { useRef } from 'react'
import { classNames } from '~/utils/classNames'
import { useClerkTheme } from '~/utils/useClerkTheme'
import { LayoutLoaderData } from '../../routes/_app/route'
import { ThemeToggle } from '../theme-toggle'
import { classnames } from '../utils/classnames'

export type NavigationItemProps = {
  name: string
  href: string
  icon: React.ForwardRefExoticComponent<
    Omit<React.SVGProps<SVGSVGElement>, 'ref'> & {
      title?: string | undefined
      titleId?: string | undefined
    } & React.RefAttributes<SVGSVGElement>
  >
  activeIcon?: React.ForwardRefExoticComponent<
    Omit<React.SVGProps<SVGSVGElement>, 'ref'> & {
      title?: string | undefined
      titleId?: string | undefined
    } & React.RefAttributes<SVGSVGElement>
  >
  notificationCount?: string
  end?: boolean
  mobile?: boolean
}

export type SidebarNavigationProps = {
  logoUrl: string
  navigation: NavigationItemProps[]
} & LayoutLoaderData

const SidebarNavigation: React.FC<SidebarNavigationProps> = ({
  logoUrl,
  navigation = [],
  ...layoutData
}) => {
  const location = useLocation()
  const pathParts = location.pathname.split('/')
  const hidePostButton =
    layoutData.anonymousView ||
    (pathParts.indexOf('profile') !== -1 && pathParts.indexOf('status') !== -1)

  const userButtonRef = useRef<HTMLDivElement>(null)
  const clerkTheme = useClerkTheme()

  return (
    <div className="flex grow flex-col gap-y-5 overflow-y-auto px-6">
      <div className="flex flex-col gap-2 xl:flex-row gap-x-3 h-16 shrink-0 items-center justify-center xl:justify-start text-primary-text">
        <img className="h-8 w-auto" src={logoUrl} alt="bchouse.fly.dev" />{' '}
        <span className="font-bold text-lg hidden xl:inline">
          <span className="text-[#0ac18e]">BCH</span>ouse
        </span>
        <div className="hidden xl:block xl:ml-auto">
          <ThemeToggle />
        </div>
      </div>
      <nav className="flex flex-1 flex-col">
        <ul role="list" className="flex flex-1 flex-col gap-y-7">
          <li>
            <ul role="list" className="-mx-2 space-y-3">
              <li
                className={classnames(
                  'xl:hidden group flex text-base text-primary-text leading-6 font-medium',
                  'justify-center xl:justify-start items-center'
                )}
              >
                <ThemeToggle />
              </li>
              {navigation.map((item, i) => (
                <li key={item.name} className="relative">
                  <NavLink
                    to={item.href}
                    className={({ isActive }) =>
                      classNames(
                        isActive ? 'font-semibold' : '',
                        'group flex text-base text-primary-text leading-6 font-medium',
                        'justify-center xl:justify-start items-center',
                        ''
                      )
                    }
                  >
                    {({ isActive }) => {
                      const Icon = isActive
                        ? item.activeIcon || item.icon
                        : item.icon
                      return (
                        <>
                          <div className="hover:bg-hover transition-colors ease-in-out duration-300 rounded-full p-2 xl:pr-4 flex flex-row gap-x-3 items-center">
                            <Icon
                              className={classNames(
                                isActive ? 'stroke-2' : '',
                                'h-8 w-8 shrink-0'
                              )}
                              aria-hidden="true"
                            />
                            <span className="hidden xl:inline">
                              {item.name}
                            </span>
                          </div>
                          {item.notificationCount ? (
                            <span
                              className="hidden xl:inline ml-auto w-9 min-w-max whitespace-nowrap rounded-full px-2.5 py-0.5 text-center text-xs font-medium leading-5 ring-1 ring-inset ring-primary-btn-500"
                              aria-hidden="true"
                            >
                              {item.notificationCount}
                            </span>
                          ) : null}
                          {item.notificationCount ? (
                            <span
                              className="flex xl:hidden items-center justify-center w-5 h-5 absolute right-1 -top-1 whitespace-nowrap rounded-full bg-primary-btn-600 text-center text-xs font-medium text-white"
                              aria-hidden="true"
                            >
                              {item.notificationCount}
                            </span>
                          ) : null}
                        </>
                      )
                    }}
                  </NavLink>
                </li>
              ))}
            </ul>
          </li>
          {layoutData.anonymousView ? (
            <li className="flex justify-center">
              <SignInButton
                mode="modal"
                afterSignInUrl="/home"
                afterSignUpUrl="/auth/registration"
              >
                <button
                  type="button"
                  className="min-h-[60px] min-w-[60px] text-center inline-flex items-center justify-center rounded-full w-full bg-primary-btn-400 tracking-wide px-4 py-2.5 text-base font-semibold text-white shadow-sm hover:bg-primary-btn-500 transition-colors ease-in-out duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-btn-600"
                >
                  <span>Login</span>
                </button>
              </SignInButton>
            </li>
          ) : null}
          {!hidePostButton ? (
            <li className="flex justify-center">
              <Link
                to={{ search: '?modal=create-post' }}
                replace={true}
                preventScrollReset={true}
                type="button"
                className="min-h-[60px] min-w-[60px] text-center inline-flex items-center justify-center rounded-full w-full bg-primary-btn-400 tracking-wide px-4 py-2.5 text-base font-semibold text-white shadow-sm hover:bg-primary-btn-500 transition-colors ease-in-out duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-btn-600"
              >
                <span className="hidden xl:block">Create post</span>
                <div className="xl:hidden">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-6 h-6"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 4.5v15m7.5-7.5h-15"
                    />
                  </svg>
                </div>
              </Link>
            </li>
          ) : null}
          {!layoutData.anonymousView ? (
            <li className="-mx-6 mt-auto">
              <div className="relative">
                <Menu as="div" className="flex text-left">
                  <div
                    onClick={() => {
                      const element =
                        userButtonRef.current?.getElementsByClassName(
                          'cl-userButtonTrigger'
                        )?.[0] as HTMLButtonElement | undefined
                      element?.click()
                    }}
                    className="cursor-pointer flex grow justify-center xl:justify-start items-center gap-x-4 px-6 py-3 text-base font-semibold leading-6"
                  >
                    <div
                      ref={userButtonRef}
                      className="pointer-events-none"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <UserButton
                        appearance={{
                          baseTheme: clerkTheme,
                          userProfile: {
                            baseTheme: clerkTheme,
                          },
                          elements: {
                            avatarBox: 'h-10 w-10',
                            userButtonTrigger: 'pointer-events-none',
                          },
                        }}
                        afterSignOutUrl={'/'}
                      />
                    </div>
                    <div className="hidden xl:flex flex-col gap-0.5 items-start">
                      <span className="" aria-hidden="true">
                        {layoutData.profile.fullName}
                      </span>
                      <span className="text-secondary-text" aria-hidden="true">
                        @{layoutData.profile.username}
                      </span>
                    </div>
                  </div>
                </Menu>
              </div>
            </li>
          ) : (
            <></>
          )}
        </ul>
      </nav>
    </div>
  )
}

export default SidebarNavigation
