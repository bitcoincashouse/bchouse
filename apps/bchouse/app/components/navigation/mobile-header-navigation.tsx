import { SignInButton, UserButton } from '@clerk/remix'
import { Dialog, Menu, Transition } from '@headlessui/react'
import { XMarkIcon } from '@heroicons/react/20/solid'
import { NavLink, useLocation } from '@remix-run/react'
import React, { Fragment, useRef } from 'react'
import { classNames } from '~/utils/classNames'
import { useClerkTheme } from '~/utils/useClerkTheme'
import { Avatar } from '../avatar'
import { useCurrentUser } from '../context/current-user-context'
import { useMobileMenu } from '../mobile-menu-provider'
import { Search } from '../search/autocomplete-search'
import { ThemeToggle } from '../theme-toggle'
import { NavigationItemProps } from './sidebar-navigation'

export type AdminLayoutProps = {
  logoUrl?: string
  showAvatar?: boolean
  navigation?: NavigationItemProps[]
}

export const MobileHeaderNavigation: React.FC<AdminLayoutProps> = ({
  logoUrl,
  navigation = [],
}) => {
  const location = useLocation()
  const currentUser = useCurrentUser()
  const isSearchView = location.pathname === '/explore'
  const { menuOpen, setMenuOpen } = useMobileMenu()
  const userButtonRef = useRef<HTMLDivElement>(null)
  const clerkTheme = useClerkTheme()

  return (
    <>
      <nav
        className={classNames(
          'sticky z-50 non-mobile:bg-transparent h-full',
          'relative flex items-center justify-between',
          'mx-auto  px-2 py-2 sm:px-4 lg:px-8'
        )}
      >
        <div className="flex flex-1 items-center justify-center px-2 lg:ml-6 lg:justify-end search">
          <div className="mr-auto flex flex-shrink-0 items-center px-2 lg:px-0 max-w-7xl">
            <button
              className="flex"
              type="button"
              onClick={() => setMenuOpen(true)}
            >
              <Avatar
                src={
                  currentUser.isAnonymous ? undefined : currentUser.avatarUrl
                }
                className="block h-8 w-auto"
              />
            </button>
          </div>
          {isSearchView ? (
            <>
              <div className="px-6 w-full">
                <Search />
              </div>
              <LogoImage logoUrl={logoUrl} className="ml-auto" />
            </>
          ) : (
            <LogoImage logoUrl={logoUrl} />
          )}
        </div>
      </nav>
      <Transition.Root show={menuOpen} as={Fragment}>
        <Dialog
          as="div"
          className="relative z-50 lg:hidden"
          onClose={() => setMenuOpen(false)}
        >
          <Transition.Child
            as={Fragment}
            enter="transition-opacity ease-linear duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity ease-linear duration-300"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-gray-900/80" />
          </Transition.Child>

          <div className="fixed inset-0 flex">
            <Transition.Child
              as={Fragment}
              enter="transition ease-in-out duration-300 transform"
              enterFrom="-translate-x-full"
              enterTo="translate-x-0"
              leave="transition ease-in-out duration-300 transform"
              leaveFrom="translate-x-0"
              leaveTo="-translate-x-full"
            >
              <Dialog.Panel className="relative mr-16 flex w-full max-w-xs flex-1 bg-primary">
                <Transition.Child
                  as={Fragment}
                  enter="ease-in-out duration-300"
                  enterFrom="opacity-0"
                  enterTo="opacity-100"
                  leave="ease-in-out duration-300"
                  leaveFrom="opacity-100"
                  leaveTo="opacity-0"
                >
                  <div className="absolute left-full top-0 flex w-16 justify-center pt-5">
                    <button
                      type="button"
                      className="-m-2.5 p-2.5"
                      onClick={() => setMenuOpen(false)}
                    >
                      <span className="sr-only">Close sidebar</span>
                      <XMarkIcon
                        className="h-6 w-6 text-white"
                        aria-hidden="true"
                      />
                    </button>
                  </div>
                </Transition.Child>
                {/* Sidebar component, swap this element with another sidebar if you like */}
                <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-primary-600 px-6 pb-2">
                  <div className="flex gap-2 flex-row gap-x-3 h-16 shrink-0 items-center justify-start text-primary-text">
                    <img
                      className="h-8 w-auto"
                      src={logoUrl}
                      alt="bchouse.fly.dev"
                    />{' '}
                    <span className="font-bold text-lg inline">
                      <span className="text-[#0ac18e]">BCH</span>ouse
                    </span>
                    <div className="ml-auto flex items-center">
                      <ThemeToggle />
                    </div>
                  </div>
                  <nav className="flex flex-1 flex-col">
                    <ul role="list" className="flex flex-1 flex-col gap-y-7">
                      <li>
                        <ul role="list" className="-mx-2 space-y-4">
                          {navigation.map((item, i) => (
                            <li key={item.name} className="relative">
                              {'href' in item ? (
                                <NavLink
                                  to={item.href}
                                  className={({ isActive }) =>
                                    classNames(
                                      isActive
                                        ? 'font-semibold underline underline-offset-4'
                                        : '',
                                      'group flex text-base text-primary-text leading-6 font-medium',
                                      'justify-start items-center text-sm',
                                      ''
                                    )
                                  }
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setMenuOpen(false)
                                  }}
                                >
                                  {({ isActive }) => {
                                    const Icon = isActive
                                      ? item.activeIcon || item.icon
                                      : item.icon
                                    return (
                                      <>
                                        <div className="hover:bg-hover transition-colors ease-in-out duration-300 rounded-full pr-4 flex flex-row gap-x-3 items-center">
                                          <Icon
                                            className={classNames(
                                              isActive ? 'stroke-2' : '',
                                              'h-6 w-6 shrink-0'
                                            )}
                                            aria-hidden="true"
                                          />
                                          <span className="inline">
                                            {item.name}
                                          </span>
                                        </div>
                                        {item.notificationCount ? (
                                          <span
                                            className="inline ml-auto w-9 min-w-max whitespace-nowrap rounded-full px-2.5 py-0.5 text-center text-xs font-medium leading-5 ring-1 ring-inset ring-primary-btn-500"
                                            aria-hidden="true"
                                          >
                                            {item.notificationCount}
                                          </span>
                                        ) : null}
                                      </>
                                    )
                                  }}
                                </NavLink>
                              ) : null}
                            </li>
                          ))}
                        </ul>
                      </li>
                      {currentUser.isAnonymous ? (
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
                      {!currentUser.isAnonymous ? (
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
                                className="cursor-pointer flex xl:justify-start items-center gap-x-4 px-6 py-3 text-base font-semibold leading-6"
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
                                        userButtonTrigger:
                                          'pointer-events-none',
                                      },
                                    }}
                                    afterSignOutUrl={'/'}
                                  />
                                </div>
                                <div className="flex flex-col gap-0.5 items-start">
                                  <span className="" aria-hidden="true">
                                    {currentUser.fullName}
                                  </span>
                                  <span
                                    className="text-secondary-text"
                                    aria-hidden="true"
                                  >
                                    @{currentUser.username}
                                  </span>
                                </div>
                              </div>
                            </Menu>
                          </div>
                        </li>
                      ) : (
                        <></>
                      )}
                      {/* <li>
                        <div className="text-xs font-semibold leading-6 text-primary-200">
                          Your teams
                        </div>
                        <ul role="list" className="-mx-2 mt-2 space-y-1">
                          {teams.map((team) => (
                            <li key={team.name}>
                              <a
                                href={team.href}
                                className={classNames(
                                  team.current
                                    ? 'bg-primary-700 text-white'
                                    : 'text-primary-200 hover:text-white hover:bg-primary-700',
                                  'group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold'
                                )}
                              >
                                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border border-primary-400 bg-primary-500 text-[0.625rem] font-medium text-white">
                                  {team.initial}
                                </span>
                                <span className="truncate">{team.name}</span>
                              </a>
                            </li>
                          ))}
                        </ul>
                      </li> */}
                    </ul>
                  </nav>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition.Root>
    </>
  )
}

function LogoImage({
  logoUrl,
  className,
}: {
  logoUrl: string | undefined
  className?: string
}) {
  return logoUrl ? (
    <img
      className={classNames('block h-8 w-8', className)}
      src={logoUrl}
      alt="bchouse.fly.dev"
    />
  ) : null
}
