import { Message } from '~/components/message'
import { Pledge } from '~/components/pledge'
import { useRefundedPledges } from './_layout/hooks/useRefundedPledges'

export default function Index() {
  const { data: pledges = [] } = useRefundedPledges()

  return (
    <div className="flex flex-col">
      <ul className="flex flex-col divide-y divide-gray-100 dark:divide-gray-700 border-b border-gray-100 dark:border-gray-600">
        {pledges.length ? (
          pledges.map((pledge) => {
            return <Pledge key={pledge.pledgeRequestId} pledge={pledge} />
          })
        ) : (
          <Message
            message="No pledges here yet."
            actionMessage="When you refund a pledge, you'll see it here"
          />
        )}
      </ul>
    </div>
  )
}
