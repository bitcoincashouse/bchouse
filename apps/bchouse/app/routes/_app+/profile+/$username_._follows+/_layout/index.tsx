import { LoaderFunctionArgs } from '@remix-run/node'
import { Outlet, useParams } from '@remix-run/react'
import { $preload, $useLoaderQuery } from 'remix-query'
import { z } from 'zod'
import { ActionsPanel } from '~/components/actions'
import { StandardLayout } from '~/components/layouts/standard-layout'
import { zx } from '~/utils/zodix'
import { Header } from './header'

export const loader = async (_: LoaderFunctionArgs) => {
  const { username } = zx.parseParams(_.params, {
    username: z.string().nonempty(),
  })

  return $preload(_, '/api/profile/getPublicProfile/:username', { username })
}

export default function Index() {
  const { username } = useParams<{ username: string }>()
  const { data: profile } = $useLoaderQuery(
    '/api/profile/getPublicProfile/:username',
    {
      params: {
        username: username!,
      },
      enabled: !!username,
      staleTime: 5 * 60 * 1000,
      gcTime: 15 * 60 * 1000,
    }
  )

  //TODO: Handle no profile data
  if (!profile) return null

  return (
    <StandardLayout
      title={profile.name}
      subtitle={'@' + profile.username}
      hideBackButton={false}
      headroom={true}
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
                <div>
                  <div>
                    <div className="">
                      <div className="">
                        <Outlet />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </article>
          </div>
          <ActionsPanel actions={[]} />
        </div>
      }
    ></StandardLayout>
  )
}
