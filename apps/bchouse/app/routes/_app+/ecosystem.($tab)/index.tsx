import { Link, useLocation, useParams } from '@remix-run/react'
import { useQuery } from '@tanstack/react-query'
import { useMemo, useRef } from 'react'
import { z } from 'zod'
import { ActiveCampaignsWidget } from '~/components/active-campaigns-widget'
import { Avatar } from '~/components/avatar'
import { StandardLayout } from '~/components/layouts/standard-layout'
import { StatsWidget } from '~/components/stats-widget'
import { classNames } from '~/utils/classNames'
import { useBrowserLayoutEffect } from '~/utils/useBrowserLayoutEffect'

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

const projectSchema = z.array(
  z.object({
    id: z.string(),
    name: z.string(),
    description: z.string().optional(),
    href: z.string().optional(),
    img: z.string().optional(),
    type: z.array(z.string()),
  })
)

export const handle = {
  preventScrollRestoration: true,
  preventScrollReset: true,
  skipScrollRestoration: true,
}

export default function Index() {
  const currentTab = useParams().tab as string
  const { data, isLoading } = useQuery({
    queryKey: ['ecosystem'],
    queryFn: async () => {
      return fetch(
        window.env.UMBRACO_URL + '/umbraco/api/ecosystem/getallprojects'
      )
        .then((res) => res.json())
        .then((projects) => projectSchema.parse(projects))
    },
    staleTime: Infinity,
    gcTime: Infinity,
  })

  const items = useMemo(() => {
    if (!data) return []

    if (!currentTab)
      return data.map((item) => ({
        id: item.id,
        name: item.name,
        href: item.href,
        img: item.img,
        description: item.description,
      }))

    const currentTabName = currentTab.toLowerCase()
    return data
      .filter((item) => item.type.find((type) => type == currentTabName))
      .map((item) => ({
        id: item.id,
        name: item.name,
        href: item.href,
        img: item.img,
        description: item.description,
      }))
  }, [currentTab, data])

  const currentTabRef = useRef<HTMLAnchorElement>(null)

  useBrowserLayoutEffect(() => {
    const findOverflowXParent = (element: HTMLElement) => {
      let parent = element.parentNode

      while (parent) {
        const styles = window.getComputedStyle(parent as HTMLElement)
        const overflowX = styles.overflowX

        if (overflowX === 'auto' || overflowX === 'scroll') {
          return parent
        }

        parent = parent.parentNode
      }

      return null
    }

    if (currentTabRef.current) {
      const element = currentTabRef.current
      const parent = findOverflowXParent(element) as HTMLElement | null

      if (!parent) return

      // Calculate the scrollLeft to bring the element into view
      const scrollLeft =
        element.offsetLeft - parent.offsetWidth / 2 + element.offsetWidth / 2

      // Scroll horizontally
      parent.scrollTo({
        left: scrollLeft,
        behavior: 'instant',
      })
    }
  }, [])

  const location = useLocation()

  return (
    <StandardLayout
      title="BCH Ecosystem"
      subtitle={
        <>
          Courtesy of{' '}
          <a
            target="_blank"
            rel="noopener noreferrer nofollow"
            href="https://helpme.cash"
            className="text-blue-500 font-bold"
          >
            Helpme.cash
          </a>
        </>
      }
      hideBackButton={true}
      header={
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
                          tab.href.toLowerCase() ===
                            currentTab?.toLowerCase() ||
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
      }
      main={
        <div>
          <div>
            <article className="max-w-5xl mx-auto">
              <section aria-labelledby="profile-overview-title">
                <div className="shadow">
                  <h2 className="sr-only" id="profile-overview-title">
                    Profile Overview
                  </h2>
                </div>
              </section>
              <div className="min-h-[1500px]">
                <div className="">
                  <div>
                    <div className="">
                      <div key={location.pathname}>
                        {items.map((item) => (
                          <div className="w-full" key={item.id}>
                            <div className="relative py-4 px-4">
                              <div className="relative">
                                <div className="relative flex items-start">
                                  <div className="relative mr-2">
                                    <Avatar
                                      className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-400"
                                      src={item.img}
                                      alt=""
                                    />
                                  </div>
                                  <div className="min-w-0 flex-1 relative">
                                    <div>
                                      <div className="flex">
                                        <div className="text-[15px]">
                                          <a
                                            target="_blank"
                                            rel="noopener noreferrer nofollow"
                                            href={item.href}
                                            className="font-bold text-primary-text hover:underline"
                                          >
                                            {item.name}
                                          </a>
                                        </div>
                                        <div className="ml-auto">
                                          {/* <PostCard.ItemMenu /> */}
                                        </div>
                                      </div>
                                    </div>
                                    <div>
                                      <div
                                        className={classNames(
                                          'my-2 text-[15px] text-primary-text prose flex flex-col gap-2',
                                          '[&_p]:m-0',
                                          '[&_img]:aspect-[5/4] [&_img]:object-cover [&_img]:m-0 [&_img]:rounded-lg [&_img]:overflow-hidden [&_img]:relative [&_img]:w-full [&_img]:h-full'
                                        )}
                                      >
                                        {item.description}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </article>
          </div>
        </div>
      }
      widgets={[<StatsWidget />, <ActiveCampaignsWidget />]}
    ></StandardLayout>
  )
}
