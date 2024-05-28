import { ShouldRevalidateFunctionArgs } from '@remix-run/react'
import { $useLoaderQuery } from 'remix-query'
import { Message } from '~/components/message'
import { Pledge } from '~/components/pledge'

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
  const { data: pledges = [] } = $useLoaderQuery('/api/campaign/pledge/list', {
    gcTime: 5 * 60 * 1000,
    staleTime: 1 * 60 * 1000,
  })

  return (
    <div className="flex flex-col">
      <ul className="flex flex-col divide-y divide-gray-100 dark:divide-gray-700 border-b border-gray-100 dark:border-gray-600">
        {pledges.length ? (
          pledges.map((pledge) => (
            <Pledge key={pledge.pledgeRequestId} pledge={pledge} />
          ))
        ) : (
          <Message
            message="No pledges here yet"
            actionMessage="When you make a pledge, you'll see it here"
          />
        )}
      </ul>
    </div>
  )
}
