import { pluralize } from '@bchouse/utils'
import { LoaderFunctionArgs } from '@remix-run/node'
import { useNavigate } from '@remix-run/react'
import { useMemo } from 'react'
import { $preload, $useActionMutation, $useLoaderQuery } from 'remix-query'
import { ActiveCampaignsWidget } from '~/components/active-campaigns-widget'
import { StandardLayout } from '~/components/layouts/standard-layout'
import { StatsWidget } from '~/components/stats-widget'
import { Grid } from './grid'

export const loader = async (_: LoaderFunctionArgs) => {
  return $preload(_, '/api/profile/listInviteCodes')
}

export default function Index() {
  const inviteMutation = $useActionMutation('/api/profile/invite/create')

  const result = inviteMutation.data

  const invitationQuery = $useLoaderQuery('/api/profile/listInviteCodes', {
    gcTime: 5 * 60 * 1000,
    staleTime: 15 * 60 * 1000,
  })

  const {
    inviteCodes = [],
    allowedCodes = 0,
    remainingCodes = 0,
  } = invitationQuery.data || {}

  const inviteMsg = useMemo(
    () =>
      pluralize({
        singular: 'code',
        plural: 'codes',
        count: allowedCodes,
      }),
    [allowedCodes]
  )

  const navigate = useNavigate()

  return (
    <>
      <StandardLayout
        title={
          <h2 className="text-3xl font-bold tracking-tight text-primary-text">
            Invite codes
          </h2>
        }
        main={
          <div className="overflow-hidden w-screen md:w-auto flex flex-1 flex-col justify-center lg:py-12 px-4 sm:px-6 lg:flex-none lg:px-20 xl:px-24">
            <div className="mx-auto w-full max-w-sm lg:w-96">
              <div>
                <p className="mt-2 text-sm text-secondary-text">
                  You{' '}
                  <span className="font-medium text-indigo-600">
                    have {remainingCodes} {inviteMsg} left
                  </span>
                </p>
              </div>
              <div className="">
                <div className="flex flex-col gap-4">
                  <Grid codes={inviteCodes}></Grid>

                  <div>
                    <form className="flex gap-4 caret-black" method="POST">
                      <div className="bg-purple-500 rounded-full text-white font-semibold">
                        <button type="submit" className="p-4">
                          {inviteMutation.status === 'pending'
                            ? 'Generating'
                            : 'Generate'}
                        </button>
                      </div>
                    </form>

                    {result?.error ? (
                      <div className="pt-2 text-red-400 font-readable">
                        {result.message}
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          </div>
        }
        widgets={[<StatsWidget />, <ActiveCampaignsWidget />]}
      ></StandardLayout>
    </>
  )
}
