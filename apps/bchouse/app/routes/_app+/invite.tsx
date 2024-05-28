import { moment, pluralize } from '@bchouse/utils'
import { LoaderFunctionArgs } from '@remix-run/node'
import { Link, useNavigate, useSearchParams } from '@remix-run/react'
import { useMemo } from 'react'
import { $preload, $useActionMutation, $useLoaderQuery } from 'remix-query'
import { ActiveCampaignsWidget } from '~/components/active-campaigns-widget'
import { StandardLayout } from '~/components/layouts/standard-layout'
import { Message } from '~/components/message'
import { StatsWidget } from '~/components/stats-widget'
import { classnames } from '~/components/utils/classnames'

export const loader = async (_: LoaderFunctionArgs) => {
  return $preload(_, '/api/profile/listInviteCodes')
}

export default function Index() {
  const [searchParams] = useSearchParams()
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

function Grid({
  codes,
}: {
  codes: {
    code: string
    claimedEmailAddress: string | null
    createdAt: Date
  }[]
}) {
  return (
    <div>
      <ul
        role="list"
        className="mt-3 flex flex-col gap-2 h-96 overflow-y-auto overflow-x-hidden"
      >
        {!codes.length ? (
          <div className="h-full w-full flex items-center justify-center">
            <Message
              message="No codes generated"
              actionMessage=""
              className="p-0"
            />
          </div>
        ) : null}

        {codes.map((code) => (
          <li key={code.code} className="flex rounded-md shadow-sm pr-4">
            <div
              className={classnames(
                'text-center flex bg-indigo-200 dark:bg-indigo-900 w-1/4 max-w-40 flex-shrink-0 items-center justify-center rounded-l-md text-sm font-medium text-primary-text'
              )}
            >
              {moment(code.createdAt).fromNow()}
            </div>
            <div className="flex flex-grow items-center justify-between truncate rounded-r-md border-b border-r border-t border-gray-300 dark:border-gray-700 bg-secondary">
              <div className="flex-1 truncate px-4 py-2 text-sm">
                <Link
                  to={'./claim/' + code.code}
                  relative="path"
                  className="font-medium text-primary-text hover:text-gray-600"
                >
                  {code.code}
                </Link>
                <p className="text-secondary-text truncate">
                  {code.claimedEmailAddress ? (
                    <>
                      Claimed by{' '}
                      <span title={code.claimedEmailAddress}>
                        {code.claimedEmailAddress}
                      </span>
                    </>
                  ) : (
                    'Unclaimed'
                  )}
                </p>
              </div>
              {/* <div className="flex-shrink-0 pr-2">
                <button
                  type="button"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-transparent bg-secondary text-secondary-text hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                >
                  <span className="sr-only">Open options</span>
                  <EllipsisVerticalIcon
                    className="h-5 w-5"
                    aria-hidden="true"
                  />
                </button>
              </div> */}
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
