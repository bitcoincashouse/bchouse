/*
  This example requires some changes to your config:
  
  ```
  // tailwind.config.js
  module.exports = {
    // ...
    plugins: [
      // ...
      require('@tailwindcss/forms'),
    ],
  }
  ```
*/
import { SignInButton, SignUpButton } from '@clerk/remix'
import { Disclosure, Menu, Transition } from '@headlessui/react'
import { MagnifyingGlassIcon } from '@heroicons/react/20/solid'
import { Bars3Icon, BellIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { Link } from '@remix-run/react'
import { Fragment } from 'react'
import { classNames } from '../utils/classNames'
import { Avatar } from './avatar'

export type Link = Omit<
  React.DetailedHTMLProps<
    React.AnchorHTMLAttributes<HTMLAnchorElement>,
    HTMLAnchorElement
  >,
  'children'
> & { name: string; current?: boolean }

export type AdminLayoutProps = {
  profile?: any
  logoUrl: string
  navigation?: Link[]
  userNavigation?: Link[]
  hideBorder?: boolean
  hideSearch?: boolean
  showAvatar?: boolean
  isLoggedIn?: boolean
}

export const Navigation: React.FC<AdminLayoutProps> = ({
  profile,
  isLoggedIn,
  showAvatar = false,
  logoUrl,
  navigation = [],
  userNavigation = [],
  hideBorder = false,
  hideSearch = false,
}) => {
  return (
    <Disclosure as="div">
      {({ open }) => (
        <nav
          className={classNames(
            'bg-primary-btn-600 z-30 lg:bg-transparent',
            !hideBorder
              ? 'border-b border-teal-500 border-opacity-25 lg:border-none'
              : ''
          )}
        >
          <div className="mx-auto max-w-7xl px-2 sm:px-4 lg:px-8">
            <div className="relative flex h-16 items-center justify-between lg:border-b lg:border-sky-800">
              <div className="flex items-center px-2 lg:px-0">
                {showAvatar ? (
                  <Disclosure.Button className="inline-flex items-center justify-center rounded-md p-2 text-sky-200 hover:bg-sky-800 hover:text-white focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white">
                    <Avatar
                      src={profile?.avatar}
                      className="block h-8 w-auto"
                    />
                  </Disclosure.Button>
                ) : (
                  <div className="flex gap-x-3 h-16 shrink-0 items-center justify-center xl:justify-start">
                    <img
                      className="h-8 w-auto"
                      src={logoUrl}
                      alt="bchouse.fly.dev"
                    />{' '}
                    <span className="font-bold text-lg hidden sm:inline text-white">
                      <span className="text-[#0ac18e]">BCH</span>ouse
                    </span>
                  </div>
                )}
                <div className="hidden lg:ml-4 lg:block lg:space-x-4">
                  <div className="flex">
                    {navigation.map((item) => (
                      <a
                        onClick={item.onClick}
                        key={item.name}
                        href={item.href}
                        className={classNames(
                          item.current
                            ? 'bg-black bg-opacity-25'
                            : 'hover:bg-sky-800',
                          'rounded-md py-2 px-3 text-sm font-medium text-white'
                        )}
                      >
                        {item.name}
                      </a>
                    ))}
                  </div>
                </div>
              </div>
              {!hideSearch && (
                <div className="flex flex-1 justify-center px-2 lg:ml-6 lg:justify-end">
                  <SearchIcon />
                </div>
              )}
              {!!userNavigation.length && (
                <div className="flex lg:hidden">
                  <MobileNavigationIcon
                    open={open && !!userNavigation.length}
                  />
                </div>
              )}
              {!!profile && (
                <div className="hidden lg:ml-4 lg:block">
                  <div className="flex items-center">
                    <NotificationIcon />
                    <ProfileMenu
                      profile={profile}
                      userNavigation={userNavigation}
                    />
                  </div>
                </div>
              )}
              <div className="flex flex-1 px-2 lg:ml-6 justify-end gap-4">
                {isLoggedIn ? (
                  <>
                    <Link
                      to={'/home'}
                      className="bg-primary-btn-500 text-white font-semibold rounded-full px-4 py-2"
                    >
                      Dashboard
                    </Link>
                  </>
                ) : (
                  <>
                    <SignUpButton
                      mode="modal"
                      afterSignInUrl="/home"
                      afterSignUpUrl="/auth/registration"
                    >
                      <button className="bg-primary-btn-500 text-white font-semibold rounded-full px-4 py-2">
                        Sign up
                      </button>
                    </SignUpButton>
                    <SignInButton
                      mode="modal"
                      afterSignInUrl="/home"
                      afterSignUpUrl="/auth/registration"
                    >
                      <button className="bg-white text-gray-800 font-semibold rounded-full px-4 py-2">
                        Sign in
                      </button>
                    </SignInButton>
                  </>
                )}
              </div>
            </div>
          </div>

          {!!profile && (
            <MobileNavigationMenu
              profile={profile}
              navigation={navigation}
              userNavigation={userNavigation}
            />
          )}
        </nav>
      )}
    </Disclosure>
  )
}

const ProfileMenu: React.FC<{ profile: any; userNavigation: Link[] }> = ({
  profile,
  userNavigation,
}) => {
  return (
    <>
      {/* Profile dropdown */}
      <Menu as="div" className="relative ml-4 flex-shrink-0 z-30">
        <div>
          <Menu.Button className="flex rounded-full text-sm text-white focus:bg-sky-900 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-sky-900">
            <span className="sr-only">Open user menu</span>
            <Avatar className="w-8 h-8" src={profile.avatar} />
          </Menu.Button>
        </div>
        <Transition
          as={Fragment}
          enter="transition ease-out duration-100"
          enterFrom="transform opacity-0 scale-95"
          enterTo="transform opacity-100 scale-100"
          leave="transition ease-in duration-75"
          leaveFrom="transform opacity-100 scale-100"
          leaveTo="transform opacity-0 scale-95"
        >
          <Menu.Items className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
            {userNavigation.map((item) => (
              <Menu.Item key={item.name}>
                {({ active }) => (
                  <a
                    href={item.href}
                    onClick={item.onClick}
                    className={classNames(
                      active ? 'bg-gray-100' : '',
                      'block py-2 px-4 text-sm text-gray-700'
                    )}
                  >
                    {item.name}
                  </a>
                )}
              </Menu.Item>
            ))}
          </Menu.Items>
        </Transition>
      </Menu>
    </>
  )
}

const MobileNavigationMenu: React.FC<{
  profile: any
  navigation: Link[]
  userNavigation: Link[]
}> = ({ profile, navigation, userNavigation }) => {
  return (
    <>
      <Disclosure.Panel className="absolute w-full bg-sky-900 lg:hidden">
        <div className="space-y-1 px-2 pt-2 pb-3">
          {navigation.map((item) => (
            <Disclosure.Button
              key={item.name}
              as={'a'}
              onClick={item.onClick}
              href={item.href}
              className={classNames(
                item.current ? 'bg-black bg-opacity-25' : 'hover:bg-sky-800',
                'block rounded-md py-2 px-3 text-base font-medium text-white'
              )}
            >
              {item.name}
            </Disclosure.Button>
          ))}
        </div>
        <div className="border-t border-sky-800 pt-4 pb-3">
          <div className="flex items-center px-4">
            <div className="flex-shrink-0">
              <Avatar className="w-10 h-10" src={profile.avatar} />
            </div>
            <div className="ml-3">
              <div className="text-base font-medium text-white">
                {profile.name}
              </div>
              <div className="text-sm font-medium text-sky-200">
                {profile.email}
              </div>
            </div>
            <button
              type="button"
              className="ml-auto flex-shrink-0 rounded-full p-1 text-sky-200 hover:bg-sky-800 hover:text-white focus:bg-sky-900 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-sky-900"
            >
              <span className="sr-only">View notifications</span>
              <BellIcon className="h-6 w-6" aria-hidden="true" />
            </button>
          </div>
          <div className="mt-3 px-2">
            {userNavigation.map((item) => (
              <Disclosure.Button
                key={item.name}
                as={'a'}
                onClick={item.onClick}
                href={item.href}
                className="block rounded-md py-2 px-3 text-base font-medium text-sky-200 hover:bg-sky-800 hover:text-white"
              >
                {item.name}
              </Disclosure.Button>
            ))}
          </div>
        </div>
      </Disclosure.Panel>
    </>
  )
}

const NotificationIcon: React.FC<{}> = ({}) => {
  return (
    <button
      type="button"
      className="flex-shrink-0 rounded-full p-1 text-sky-200 hover:bg-sky-800 hover:text-white focus:bg-sky-900 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-sky-900"
    >
      <span className="sr-only">View notifications</span>
      <BellIcon className="h-6 w-6" aria-hidden="true" />
    </button>
  )
}

const MobileNavigationIcon: React.FC<{ open: boolean }> = ({ open }) => {
  return (
    <>
      {/* Mobile menu button */}
      <Disclosure.Button className="inline-flex items-center justify-center rounded-md p-2 text-sky-200 hover:bg-sky-800 hover:text-white focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white">
        <span className="sr-only">Open main menu</span>
        {open ? (
          <XMarkIcon
            className="block h-6 w-6 flex-shrink-0"
            aria-hidden="true"
          />
        ) : (
          <Bars3Icon
            className="block h-6 w-6 flex-shrink-0"
            aria-hidden="true"
          />
        )}
      </Disclosure.Button>
    </>
  )
}

const SearchIcon: React.FC<{}> = ({}) => {
  return (
    <>
      <div className="w-full max-w-lg lg:max-w-xs">
        <label htmlFor="search" className="sr-only">
          Search campaigns
        </label>
        <div className="relative text-sky-100 focus-within:text-gray-400">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <MagnifyingGlassIcon
              className="h-5 w-5 flex-shrink-0"
              aria-hidden="true"
            />
          </div>
          <input
            id="search"
            name="search"
            className="block w-full rounded-md border border-transparent bg-sky-700 bg-opacity-50 py-2 pl-10 pr-3 leading-5 placeholder-sky-100 focus:border-white focus:bg-white focus:text-primary-text focus:placeholder-gray-500 focus:outline-none focus:ring-white sm:text-sm"
            placeholder="Search our campaigns"
            type="search"
          />
        </div>
      </div>
    </>
  )
}
