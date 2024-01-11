import { EllipsisHorizontalIcon } from '@heroicons/react/20/solid'
import { NavLink } from '@remix-run/react'
import { classNames } from '~/utils/classNames'
import { useMobileMenu } from '../mobile-menu-provider'
import { classnames } from '../utils/classnames'
import { NavigationItemProps } from './sidebar-navigation'

export function MobileNavigation({
  navigation,
}: {
  navigation: NavigationItemProps[]
  notifications?: number
}) {
  const { setMenuOpen } = useMobileMenu()

  return (
    <div className="p-1 px-6 bg-primary border-t border-gray-100 dark:border-gray-600">
      <nav className="flex flex-1 flex-col">
        <div role="list" className="sm:mx-auto sm:max-w-[1000px] w-full">
          <ul role="list" className="-mx-2 flex justify-between">
            {navigation.map(
              (item, i) =>
                item.mobile && (
                  <li key={item.name} className="relative">
                    <NavLink
                      to={item.href}
                      className={({ isActive }) =>
                        classNames(
                          isActive ? 'font-semibold' : '',
                          'group flex gap-x-3 rounded-md p-1 text-sm leading-6 font-semibold',
                          'justify-center'
                        )
                      }
                    >
                      {({ isActive }) => {
                        const Icon = isActive
                          ? item.activeIcon || item.icon
                          : item.icon
                        return (
                          <>
                            <Icon
                              className={classNames(
                                isActive
                                  ? 'stroke-2'
                                  : 'text-primary-btn-200 group-hover:text-primary-text',
                                'h-7 w-7 shrink-0'
                              )}
                              aria-hidden="true"
                            />
                            <span className="hidden xl:inline">
                              {item.name}
                            </span>
                            {item.notificationCount ? (
                              <span
                                className="flex items-center justify-center w-5 h-5 absolute -right-2 -top-1 whitespace-nowrap rounded-full bg-primary-btn-600 text-center text-xs font-medium text-gray-50"
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
                )
            )}
            <li
              className={classnames(
                'group flex gap-x-3 rounded-md p-1 text-sm leading-6 font-semibold text-primary-btn-200',
                'justify-center items-center'
              )}
            >
              <button type="button" onClick={() => setMenuOpen(true)}>
                <EllipsisHorizontalIcon className="w-6 h-6" />
              </button>
            </li>
          </ul>
        </div>
      </nav>
    </div>
  )
}
