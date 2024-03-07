import { Link } from '@remix-run/react'
import { $path } from 'remix-routes'
import { Widget } from '~/components/layouts/widget'
import { classNames } from '~/utils/classNames'
import { trpc } from '~/utils/trpc'

export function StatsWidget() {
  const { data, isLoading } = trpc.stats.useQuery(undefined, {
    staleTime: 1000 * 60,
    gcTime: 1000 * 60 * 5,
  })

  const items = data
    ? [
        {
          title: 'Registered Users',
          value: data.userCount,
        },
        {
          title: 'Active (24hrs)',
          value: data.dailyActiveUserCount,
        },
        {
          title: 'Active (Weekly)',
          value: data.weeklyActiveUserCount,
        },
      ]
    : []

  return (
    <Widget
      title="Stats"
      className="pb-2"
      keyProp={'title'}
      isLoading={isLoading}
      items={items}
      render={(item) => (
        <span>
          {item.title}: {item.value}
        </span>
      )}
    >
      {!isLoading ? (
        <div className="p-4 pb-2 flex">
          <Link
            to={$path('/invite')}
            className={classNames(
              'ml-auto inline-flex items-center justify-center rounded-full border border-transparent bg-purple-500 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-purple-600 focus:outline-none focus:ring-2 focus:ring-primary-btn-500 focus:ring-offset-2'
            )}
          >
            Invite new users
          </Link>
        </div>
      ) : null}
    </Widget>
  )
}
