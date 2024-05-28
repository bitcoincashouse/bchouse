import { logger } from '@bchouse/utils'
import { LoaderFunctionArgs } from '@remix-run/node'
import { authService, electrumService } from '~/.server/getContext'
import { getAuthRequired } from '~/utils/auth'

export const loader = async (_: LoaderFunctionArgs) => {
  try {
    const auth = await getAuthRequired(_)
    if (await authService.getIsAdmin(auth)) {
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
}
