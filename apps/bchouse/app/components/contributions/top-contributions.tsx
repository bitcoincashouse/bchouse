import { prettyPrintSats } from '@bchouse/utils'
import { HeartIcon } from '@heroicons/react/24/outline'
import { useMemo, useState } from 'react'
import { useContributionsFetcher } from '~/routes/api.contributions.$campaignId'
import { Avatar } from '../avatar'
import { Modal } from '../modal'
import { AllContributions } from './all-contributions'
import { Contribution } from './types'

type ContributionType = 'Recent' | 'Top' | 'First'

export function ContributionList({
  campaignId,
  expires,
}: {
  campaignId: string
  expires: number
}) {
  //TODO: Show recent contribution, top, and our own
  const topContributionsFetcher = useContributionsFetcher(campaignId)
  const [listOpen, setListOpen] = useState<false | ContributionType>(false)

  if (!topContributionsFetcher.data) {
    return null
  }

  const { latestContribution, topContribution, firstContribution } =
    topContributionsFetcher.data

  const openContributionList = (type: ContributionType) => {
    setListOpen(type)
  }

  return (
    <>
      <ul className="flex flex-col gap-6 px-4 pt-4">
        {latestContribution ? (
          <ContributionItem
            contribution={latestContribution}
            type="Recent"
            onClick={() => openContributionList('Recent')}
          ></ContributionItem>
        ) : null}
        {topContribution ? (
          <ContributionItem
            contribution={topContribution}
            type="Top"
            onClick={() => openContributionList('Top')}
          ></ContributionItem>
        ) : null}
        {firstContribution ? (
          <ContributionItem
            contribution={firstContribution}
            type="First"
            onClick={() => openContributionList('First')}
          ></ContributionItem>
        ) : null}
      </ul>
      <Modal
        title="All Contributions"
        open={!!listOpen}
        onClose={() => setListOpen(false)}
        className="min-h-[75vh] px-6"
        size="small"
      >
        <AllContributions campaignId={campaignId} expires={expires} />
      </Modal>
    </>
  )
}

function ContributionItem({
  contribution,
  type,
  onClick,
}: {
  contribution: Contribution
  type: ContributionType
  onClick: () => void
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

  return (
    <>
      <li>
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
              <button onClick={onClick} className="underline font-[13px]">
                {type} Donation
              </button>
            </div>
          </div>
        </div>
      </li>
    </>
  )
}
