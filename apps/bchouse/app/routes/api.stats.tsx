import { LoaderArgs } from '@remix-run/node'
import { Link } from '@remix-run/react'
import { useQuery } from '@tanstack/react-query'
import { $path } from 'remix-routes'
import { UseDataFunctionReturn, typedjson } from 'remix-typedjson'
import { Widget } from '~/components/layouts/widget'
import { classNames } from '~/utils/classNames'

export const loader = async (_: LoaderArgs) => {
  await _.context.ratelimit.limitByIp(_, 'api', true)

  const { userCount, dailyActiveUserCount, weeklyActiveUserCount } =
    await _.context.userService.getUserCounts()

  return typedjson({ userCount, dailyActiveUserCount, weeklyActiveUserCount })
}

export function StatsWidget({
  shouldLoad = true,
  initialData,
}: {
  shouldLoad?: boolean
  initialData?: {
    userCount: number
    dailyActiveUserCount: number
    weeklyActiveUserCount: number
  }
}) {
  const { data, isLoading } = useQuery(
    ['stats'],
    async () => {
      const path = $path('/api/stats')
      return fetch(path + '?_data=routes/api.stats')
        .then((res) => res.json())
        .then((data) => {
          return data as UseDataFunctionReturn<typeof loader>
        })
    },
    {
      staleTime: 1000 * 60,
      cacheTime: 1000 * 60 * 5,
      initialData,
    }
  )

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
