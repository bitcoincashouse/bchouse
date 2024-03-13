import { z } from 'zod'
import { logger } from '../utils/logger'
import { HealthcheckService } from './services/healthcheck'
import { PaygateService } from './services/paygate'
import { ElectrumNetworkProviderService } from './utils/getElectrumProvider'

const bchouseUrl = z
  .string({
    errorMap: (issue, _ctx) => {
      return { message: 'BCHOUSE_URL env var not defined' }
    },
  })
  .transform((appUrl) => appUrl.replace(/\/$/, ''))
  .parse(process.env.BCHOUSE_URL)

logger.info('BCHOUSE_URL', bchouseUrl)

const paygateUrl = z
  .string({
    errorMap: (issue, _ctx) => {
      return { message: 'PAYGATE_URL env var not defined' }
    },
  })
  .transform((appUrl) => appUrl.replace(/\/$/, ''))
  .parse(process.env.PAYGATE_URL)

logger.info('PAYGATE_URL', paygateUrl)
logger.info('INNGEST_BRANCH', process.env.INNGEST_BRANCH)
logger.info('INNGEST_EVENT_KEY', process.env.INNGEST_EVENT_KEY)
logger.info('INNGEST_SIGING_KEY', process.env.INNGEST_SIGNING_KEY)
logger.info('REDIS_URL', process.env.REDIS_URL)
logger.info('PAYGATE_DATABASE_URL', process.env.PAYGATE_DATABASE_URL)

const electrumService = await ElectrumNetworkProviderService.create(true)
const abortController = new AbortController()
const paygateService = new PaygateService(electrumService)
const signal = abortController.signal
const healthcheckService = new HealthcheckService()

async function destroy() {
  await Promise.all([electrumService.stop()])
  abortController.abort('Server destroyed')
}

process.on('SIGINT', () => destroy().then(() => process.exit()))
process.on('SIGTERM', () => destroy().then(() => process.exit()))

export { bchouseUrl, healthcheckService, paygateService, paygateUrl, signal }
