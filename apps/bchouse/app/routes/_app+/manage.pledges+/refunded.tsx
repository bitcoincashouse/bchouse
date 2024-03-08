import { useMemo } from 'react'
import { Pledge } from '~/components/pledge'
import { TimelineMessage } from '~/components/post/timeline-message'
import { trpc } from '~/utils/trpc'

export default function Index() {
  const { data: allPledges } = trpc.campaign.listPledges.useQuery(undefined, {
    gcTime: 5 * 60 * 1000,
    staleTime: 1 * 60 * 1000,
  })

  const pledges = useMemo(() => {
    return allPledges.filter((p) => !!p.refundTxId)
  }, [allPledges])

  return (
    <div className="flex flex-col">
      <ul className="flex flex-col divide-y divide-gray-100 dark:divide-gray-700 border-b border-gray-100 dark:border-gray-600">
        {pledges.length ? (
          pledges.map((pledge) => {
            return <Pledge key={pledge.pledgeRequestId} pledge={pledge} />
          })
        ) : (
          <TimelineMessage
            message="No pledges here yet."
            actionMessage="When you refund a pledge, you'll see it here"
          />
        )}
      </ul>
    </div>
  )
}
