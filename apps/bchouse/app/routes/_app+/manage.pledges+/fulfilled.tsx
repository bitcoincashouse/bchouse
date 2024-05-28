import { useMemo } from 'react'
import { $useLoaderQuery } from 'remix-query'
import { Message } from '~/components/message'
import { Pledge } from '~/components/pledge'

export default function Index() {
  const { data: allPledges = [] } = $useLoaderQuery(
    '/api/campaign/pledge/list',
    {
      gcTime: 5 * 60 * 1000,
      staleTime: 1 * 60 * 1000,
    }
  )

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
          <Message
            message="No pledges here yet."
            actionMessage="When your pledge is fulfilled, you'll see it here"
          />
        )}
      </ul>
    </div>
  )
}
