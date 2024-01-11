import { HeartIcon } from '@heroicons/react/24/outline'
import { useMemo } from 'react'
import { useAllContributionsFetcher } from '~/routes/api.contribution-list.$campaignId'
import moment from '~/utils/moment'
import { prettyPrintSats } from '~/utils/prettyPrintSats'
import { Avatar } from '../avatar'
import { Contribution } from './types'

export function AllContributions({
  campaignId,
  expires,
}: {
  campaignId: string
  expires: number
}) {
  const fetcher = useAllContributionsFetcher(campaignId)
  const isLoading = fetcher.state === 'loading'
  const contributions = fetcher.data

  return (
    <div>
      {contributions?.length ? (
        <ul className="pt-6 flex flex-col gap-6">
          {contributions.map((contribution, i) => (
            <AllContributionListItem
              contribution={contribution}
              campaignExpires={expires}
              key={contribution.pledgeRequestId}
            />
          ))}
        </ul>
      ) : (
        <div className="flex flex-col items-center justify-center p-4 pt-8 gap-2">
          {isLoading ? (
            <p className="text-gray-400">Loading...</p>
          ) : (
            <div className="flex flex-col items-center justify-center text-center p-4 pt-8 gap-2">
              <h2 className="text-xl font-semibold text-secondary-text">
                No contributions yet
              </h2>
              {
                <p className="text-gray-400">
                  When someone contributes to this campaign, you’ll see it here.
                </p>
              }
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function AllContributionListItem({
  contribution,
  campaignExpires,
}: {
  campaignExpires: number
  contribution: Contribution & { refundedAt: Date | null }
}) {
  const [amount, denomination] = useMemo(
    () => prettyPrintSats(Number(contribution.satoshis.toString())),
    [contribution.satoshis]
  )

  const name = useMemo(() => {
    if (contribution.firstName || contribution.lastName) {
      return [contribution.firstName, contribution.lastName]
        .filter(Boolean)
        .join(' ')
    }

    if (contribution.username) {
      return contribution.username
    }

    if (contribution.anonymousName) {
      return contribution.anonymousName
    }

    return 'Anonymous'
  }, [contribution])

  const { wasRevoked, refundedAt } = useMemo(() => {
    const refundedAt =
      contribution.refundedAt && moment(contribution.refundedAt)
    const wasRevoked = refundedAt && refundedAt.unix() < campaignExpires
    return {
      refundedAt,
      wasRevoked,
    }
  }, [contribution, campaignExpires])

  return (
    <li key={contribution.pledgeRequestId}>
      <div className="flex flex-row items-center gap-4">
        {contribution.avatarUrl ? (
          <Avatar src={contribution.avatarUrl} className="w-10 h-10" />
        ) : (
          <div className="bg-gray-300 dark:bg-hover rounded-full p-2">
            <HeartIcon className="w-6 h-6" />
          </div>
        )}
        <div className="flex flex-col text-sm gap-1 tracking-wide">
          <div>{name}</div>
          <div className="inline-flex gap-2">
            <span>
              {amount} <strong>{denomination}</strong>
            </span>{' '}
            {/* TODO: Add modal to view all contributions */}
            <strong className="text-gray-300">•</strong>{' '}
            <span>{moment(contribution.createdAt).fromNow()}</span>
          </div>
          {refundedAt ? (
            <div className="text-xs">
              {wasRevoked ? 'Revoked' : 'Refunded'}{' '}
              <span>{refundedAt.fromNow()}</span>
            </div>
          ) : null}
        </div>
      </div>
    </li>
  )
}
