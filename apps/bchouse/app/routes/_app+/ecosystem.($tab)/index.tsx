import { useLocation } from '@remix-run/react'
import { ActiveCampaignsWidget } from '~/components/active-campaigns-widget'
import { Avatar } from '~/components/avatar'
import { StandardLayout } from '~/components/layouts/standard-layout'
import { StatsWidget } from '~/components/stats-widget'
import { classNames } from '~/utils/classNames'
import { Header } from './header'
import { useEcosystemQuery } from './hooks/useEcosystemQuery'

export const handle = {
  preventScrollRestoration: true,
  preventScrollReset: true,
  skipScrollRestoration: true,
}

export default function Index() {
  const items = useEcosystemQuery()
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
      header={<Header />}
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
