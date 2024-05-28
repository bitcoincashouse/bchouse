import { LoaderFunctionArgs } from '@remix-run/node'
import { userService } from '~/.server/getContext'

export const loader = async (_: LoaderFunctionArgs) => {
  // await opts.ctx.ratelimit.limitByIp(_, 'api', true)

  const { userCount, dailyActiveUserCount, weeklyActiveUserCount } =
    await userService.getUserCounts()

  return { userCount, dailyActiveUserCount, weeklyActiveUserCount }
}
