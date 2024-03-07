import { useMemo } from 'react'
import { Pledge } from '~/components/pledge'
import { TimelineMessage } from '~/components/post/timeline-message'
import { usePledgesLoaderData } from './_layout'

export default function Index() {
  const { pledges: allPledges } = usePledgesLoaderData()

  const pledges = useMemo(() => {
    return allPledges.filter((p) => !!p.fulfillmentTxId)
  }, [allPledges])

  return (
    <div className="flex flex-col">
      <ul className="flex flex-col divide-y divide-gray-100 dark:divide-gray-700 border-b border-gray-100 dark:border-gray-600">
        {pledges.length ? (
          pledges.map((pledge) => (
            <Pledge key={pledge.pledgeRequestId} pledge={pledge} />
          ))
        ) : (
          <TimelineMessage
            message="No pledges here yet."
            actionMessage="When your pledge is fulfilled, you'll see it here"
          />
        )}
      </ul>
    </div>
  )
}
