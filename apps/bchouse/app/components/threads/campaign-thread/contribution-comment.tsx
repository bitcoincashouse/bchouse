import { moment, prettyPrintSats } from '@bchouse/utils'
import { HeartIcon } from '@heroicons/react/24/outline'
import { useMemo } from 'react'
import { DonorPost } from '~/components/thread-provider'
import { Avatar } from '../../avatar'

export function ContributionComment({ item }: { item: DonorPost }) {
  const [amount, denomination] = prettyPrintSats(
    Number(item.pledgeAmount),
    'BCH'
  )

  const name = useMemo(() => {
    if (item.firstName || item.lastName) {
      return [item.firstName, item.lastName].filter(Boolean).join(' ')
    }

    if (item.username) {
      return item.username
    }

    if (item.anonymousName) {
      return item.anonymousName
    }

    return 'Anonymous'
  }, [item])

  return (
    <div>
      <div className="relative py-4 px-4">
        <div className="relative flex flex-row items-start gap-4">
          {item.avatarUrl ? (
            <Avatar src={item.avatarUrl} className="w-10 h-10" />
          ) : (
            <div className="bg-gray-300 dark:bg-hover rounded-full p-2">
              <HeartIcon className="w-6 h-6" />
            </div>
          )}
          <div className="relative flex flex-col items-start gap-2">
            <div className="min-w-0 flex-1 relative">
              <span className="font-bold text-primary-text">{name}</span>
              <div>
                <span className="text-sm">
                  {amount}
                  <small className="text-xs">{denomination}</small>
                </span>{' '}
                <span className="dot-separator text-secondary-text" />{' '}
                <span className="text-sm text-secondary-text">
                  {moment(item.createdAt).fromNow()}
                </span>
              </div>
            </div>
            <div>
              <span>{item.comment}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
