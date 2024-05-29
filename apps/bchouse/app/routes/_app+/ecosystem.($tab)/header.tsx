import { Link, useParams } from '@remix-run/react'
import { useRef } from 'react'
import { classNames } from '~/utils/classNames'
import { useTabFocus } from './hooks/useTabFocus'

const tabs = [
  { name: 'All', href: '' },
  { name: 'Apps', href: 'apps' },
  { name: 'CashTokens', href: 'cashtokens' },
  { name: 'Content Creators', href: 'content' },
  { name: 'Development', href: 'development' },
  { name: 'Developer Tools', href: 'tools' },
  { name: 'Exchanges', href: 'exchanges' },
  { name: 'Explorers', href: 'explorers' },
  { name: 'Games', href: 'games' },
  { name: 'Info', href: 'info' },
  { name: 'Libraries', href: 'libraries' },
  { name: 'Nodes', href: 'nodes' },
  { name: 'NFTs', href: 'nfts' },
  { name: 'Stores', href: 'stores' },
  { name: 'Socials', href: 'socials' },
  { name: 'Wallets', href: 'wallets' },
]

export function Header() {
  const { tab: currentTab } = useParams<{ tab: string }>()
  const currentTabRef = useRef<HTMLAnchorElement>(null)
  useTabFocus(currentTabRef)

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
                  <Link
                    key={tab.name}
                    to={
                      currentTab
                        ? tab.href
                          ? '../' + tab.href
                          : '..'
                        : tab.href
                        ? './' + tab.href
                        : '.'
                    }
                    relative={'path'}
                    ref={
                      tab.href.toLowerCase() === currentTab?.toLowerCase() ||
                      (!currentTab && tab.name === 'All')
                        ? currentTabRef
                        : null
                    }
                    className={classNames(
                      tab.href === currentTab ||
                        (!currentTab && tab.name === 'All')
                        ? 'border-pink-500 text-primary-text'
                        : 'border-transparent text-secondary-text hover:border-gray-300 hover:dark:text-secondary-text',
                      'whitespace-nowrap border-b-2 py-4 px-1 font-semibold'
                    )}
                  >
                    {tab.name}
                  </Link>
                ))}
              </nav>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
