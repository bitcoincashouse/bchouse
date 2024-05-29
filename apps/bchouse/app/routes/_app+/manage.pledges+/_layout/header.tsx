import { NavLink } from '@remix-run/react'
import { classNames } from '~/utils/classNames'

const tabs = [
  { name: 'All', href: '' },
  { name: 'Current', href: 'current' },
  { name: 'Refunded', href: 'refunded' },
  { name: 'Fulfilled', href: 'fulfilled' },
]

export function Header() {
  return (
    <>
      {/* Description list*/}
      <section
        aria-labelledby="applicant-information-title"
        className="border-b border-gray-100 dark:border-gray-600 "
      >
        <div className="px-4 sm:px-6">
          <div className="overflow-x-auto h-full overflow-y-hidden">
            <div className="flex mx-auto max-w-5xl">
              <nav
                className={classNames(
                  '-mb-px flex space-x-8',
                  'flex-1 justify-around '
                )}
                aria-label="Tabs"
              >
                {tabs.map((tab, i) => (
                  <NavLink
                    key={tab.name}
                    to={tab.href}
                    end={true}
                    className={({ isActive }) =>
                      classNames(
                        isActive
                          ? 'border-pink-500 text-primary-text'
                          : 'border-transparent text-secondary-text hover:border-gray-300 hover:dark:text-secondary-text',
                        'whitespace-nowrap border-b-2 py-4 px-1 font-semibold'
                      )
                    }
                  >
                    {tab.name}
                  </NavLink>
                ))}
              </nav>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
