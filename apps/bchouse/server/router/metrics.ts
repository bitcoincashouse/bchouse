import { logger } from '@bchouse/utils'
import { publicProcedure, router } from '../trpc'

export const metricsRouter = router({
  clusters: publicProcedure.query(async (opts) => {
    try {
      if (await opts.ctx.authService.getIsAdmin(opts.ctx.auth)) {
        const electrumCluster =
          opts.ctx.electrumService.getElectrumCluster('chipnet')

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
      await opts.ctx.userService.getUserCounts()

    return { userCount, dailyActiveUserCount, weeklyActiveUserCount }
  }),
})
