import { LoaderArgs } from '@remix-run/node'
import { typedjson } from 'remix-typedjson'
import { logger } from '~/utils/logger'

export const loader = async (_: LoaderArgs) => {
  try {
    if (await _.context.authService.getIsAdmin(_)) {
      const electrumCluster =
        _.context.electrumService.getElectrumCluster('chipnet')

      const stats = {
        clients: Object.keys(electrumCluster.clients),
        connections: electrumCluster.connections,
        status: electrumCluster.status,
      }
      logger.info(stats)
      return typedjson(stats)
    } else {
      return typedjson(null)
    }
  } catch (err) {
    logger.error(err)
    return typedjson(null)
  }
}
