import { ShouldRevalidateFunctionArgs } from '@remix-run/react'
import { Pledge } from '~/components/pledge'
import { TimelineMessage } from '~/components/post/timeline-message'
import { usePledgesLoaderData } from './_layout'

export function shouldRevalidate({
  currentUrl,
  nextUrl,
  defaultShouldRevalidate,
}: ShouldRevalidateFunctionArgs) {
  return currentUrl.pathname == nextUrl.pathname
    ? false
    : defaultShouldRevalidate
}

export default function Index() {
  const { pledges } = usePledgesLoaderData()

  return (
    <div className="flex flex-col">
      <ul className="flex flex-col divide-y divide-gray-100 dark:divide-gray-700 border-b border-gray-100 dark:border-gray-600">
        {pledges.length ? (
          pledges.map((pledge) => (
            <Pledge key={pledge.pledgeRequestId} pledge={pledge} />
          ))
        ) : (
          <TimelineMessage
            message="No pledges here yet"
            actionMessage="When you make a pledge, you'll see it here"
          />
        )}
      </ul>
    </div>
  )
}
