import {
  isApplicationError,
  isClerkError,
  moment,
  pluralize,
} from '@bchouse/utils'
import { ActionArgs, LoaderArgs } from '@remix-run/node'
import { Link, useNavigate, useSearchParams } from '@remix-run/react'
import { useMemo } from 'react'
import { typedjson, useTypedFetcher, useTypedLoaderData } from 'remix-typedjson'
import { StandardLayout } from '~/components/layouts/standard-layout'
import { TimelineMessage } from '~/components/post/timeline-message'
import { classnames } from '~/components/utils/classnames'
import { ActiveCampaignsWidget } from './api.campaigns.active.($username)'
import { StatsWidget } from './api.stats'

export const loader = async (_: LoaderArgs) => {
  const { userId } = await _.context.authService.getAuth(_)
  const inviteCodes = await _.context.authService.getInviteCodes({
    userId,
  })
  return typedjson(inviteCodes)
}

export const action = async (_: ActionArgs) => {
  try {
    const { userId } = await _.context.authService.getAuth(_)

    const result = await _.context.authService.createInviteCode({
      userId,
    })

    return typedjson({
      error: false as const,
    })
  } catch (err) {
    if (isClerkError(err) && err.errors[0]) {
      return typedjson({ error: true as const, message: err.errors[0].message })
    }

    if (isApplicationError(err) && err.errors[0]) {
      return typedjson({ error: true as const, message: err.errors[0].message })
    }

    return typedjson({
      error: true as const,
      message: 'Error inviting user, please try again.',
    })
  }
}

export default function Index() {
  const [searchParams] = useSearchParams()
  const fetcher = useTypedFetcher<typeof action>()
  const result = fetcher.data
  const { inviteCodes, allowedCodes, remainingCodes } =
    useTypedLoaderData<typeof loader>()

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
                    <fetcher.Form
                      className="flex gap-4 caret-black"
                      method="POST"
                    >
                      <div className="bg-purple-500 rounded-full text-white font-semibold">
                        <button type="submit" className="p-4">
                          {fetcher.state === 'submitting'
                            ? 'Generating'
                            : 'Generate'}
                        </button>
                      </div>
                    </fetcher.Form>

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
            <TimelineMessage
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
