import { Message } from '~/components/message'
import { Pledge } from '~/components/pledge'
import { useFulfilledPledges } from './_layout/hooks/useFulfilledPledges'

export default function Index() {
  const { data: pledges = [], isLoading } = useFulfilledPledges()

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
