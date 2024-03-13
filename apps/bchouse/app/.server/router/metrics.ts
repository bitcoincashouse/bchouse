import { logger } from '@bchouse/utils'
import {
  authService,
  electrumService,
  userService,
} from '../services/getContext'
import { publicProcedure, router } from '../trpc'

export const metricsRouter = router({
  clusters: publicProcedure.query(async (opts) => {
    try {
      if (await authService.getIsAdmin(opts.ctx.auth)) {
        const electrumCluster = electrumService.getElectrumCluster('chipnet')

        const stats = {
          clients: Object.keys(electrumCluster.clients),
          connections: electrumCluster.connections,
          status: electrumCluster.status,
        }
        logger.info(stats)
        return stats
      } else {
        return null
      }
    } catch (err) {
      logger.error(err)
      return null
    }
  }),
  stats: publicProcedure.query(async (opts) => {
    // await opts.ctx.ratelimit.limitByIp(_, 'api', true)

    const { userCount, dailyActiveUserCount, weeklyActiveUserCount } =
      await userService.getUserCounts()

    return { userCount, dailyActiveUserCount, weeklyActiveUserCount }
  }),
})
