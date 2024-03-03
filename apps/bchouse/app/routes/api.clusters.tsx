import { logger } from '@bchouse/utils'
import { LoaderFunctionArgs } from '@remix-run/node'
import { typedjson } from 'remix-typedjson'

export const loader = async (_: LoaderFunctionArgs) => {
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
