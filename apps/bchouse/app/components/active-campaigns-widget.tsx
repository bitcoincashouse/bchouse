import { moment, prettyPrintSats } from '@bchouse/utils'
import { Link } from '@remix-run/react'
import { useMemo } from 'react'
import { $path } from 'remix-routes'
import { Widget } from '~/components/layouts/widget'
import { ProgressBar } from '~/components/progress-bar'
import { pluralize } from '~/components/utils'
import { classNames } from '~/utils/classNames'
import { AppRouterOutputs, trpc } from '~/utils/trpc'

export function ActiveCampaignsWidget({ username }: { username?: string }) {
  const { data, isLoading } = trpc.campaign.listActive.useQuery(
    {
      username,
    },
    {
      staleTime: 1000 * 60,
      gcTime: 1000 * 60 * 5,
    }
  )

  return (
    <>
      {data?.length ? (
        <Widget
          className="pb-2"
          listClassName="divide-none"
          title={
            username ? `Active Campaigns by @${username}` : 'Active Campaigns'
          }
          items={data || []}
          render={(item) => <CampaignItem {...item} />}
          keyProp={'id'}
          isLoading={isLoading}
        ></Widget>
      ) : null}
    </>
  )
}

function CampaignItem({
  goal: requestedAmount,
  raised: amountRaised,
  expires: expiresAt,
  pledges: contributionCount,
  title,
  username,
  statusId,
}: AppRouterOutputs['campaign']['activeCampaigns'][number]) {
  const [requestedAmountText, requestedDenominationText] =
    prettyPrintSats(requestedAmount)
  const [amountRaisedText, amountRaisedDenominationText] =
    prettyPrintSats(amountRaised)

  const expiresInText = useMemo(() => {
    const endedAt = expiresAt
    return endedAt ? (
      <>
        Ends <strong>{moment().to(moment.unix(endedAt))}</strong>
      </>
    ) : null
  }, [expiresAt])

  return (
    <div className="flex flex-col gap-2">
      <div className="text-lg text-primary-text font-semibold">{title}</div>
      <div className="hidden desktop:flex flex-wrap justify-between items-baseline gap-2">
        <span className="col-span-5">
          <span className="mr-1">
            <b className="text-base">
              {amountRaisedText} {amountRaisedDenominationText}
            </b>{' '}
            <small className="text-sm text-secondary-text">
              raised of {requestedAmountText}{' '}
              {requestedDenominationText === 'SATS'
                ? 'SAT'
                : requestedDenominationText}{' '}
              goal
            </small>
          </span>
        </span>
        <ProgressBar goal={requestedAmount} total={amountRaised}></ProgressBar>
        <small className="text-secondary-text">
          <strong> {contributionCount}</strong>{' '}
          {pluralize({
            singular: 'contribution',
            count: contributionCount,
          })}
        </small>
        <small className="text-secondary-text">{expiresInText}</small>
      </div>
      <Link
        to={$path('/profile/:username/campaign/:statusId', {
          username: username,
          statusId: statusId,
        })}
        className={classNames(
          'inline-flex items-center justify-center rounded-full border border-transparent bg-purple-500 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-purple-600 focus:outline-none focus:ring-2 focus:ring-primary-btn-500 focus:ring-offset-2'
        )}
      >
        View campaign
      </Link>
    </div>
  )
}
