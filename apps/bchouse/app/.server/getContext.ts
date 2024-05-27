import { logger } from '@bchouse/utils'
import pTimeout from 'p-timeout'
import { z } from 'zod'
import { appEnv } from '~/.server/appEnv'
import { AddressWatcher } from './services/address-watcher'
import { AuthService } from './services/auth'
import { CampaignService } from './services/campaign'
import { FeedService } from './services/feed'
import { HealthcheckService } from './services/healthcheck'
import { ImageService } from './services/image'
import { InngestService } from './services/inngest/index'
import { PledgeService } from './services/pledge'
import { PostService } from './services/post'
import { ProfileService } from './services/profile'
import { ratelimit } from './services/rateLimiter'
import { getRedis } from './services/redis'
import { SearchService } from './services/search'
import { UserService } from './services/user'
import { ElectrumNetworkProviderService } from './utils/getElectrumProvider'
import { Snowflake } from './utils/snowflake'

const bchouseUrl = z
  .string({
    errorMap: (issue, _ctx) => {
      return { message: 'BCHOUSE_URL env var not defined' }
    },
  })
  .transform((appUrl) => appUrl.replace(/\/$/, ''))
  .parse(appEnv.BCHOUSE_URL)

logger.info('BCHOUSE_URL', bchouseUrl)

const paygateUrl = z
  .string({
    errorMap: (issue, _ctx) => {
      return { message: 'PAYGATE_URL env var not defined' }
    },
  })
  .transform((appUrl) => appUrl.replace(/\/$/, ''))
  .parse(appEnv.PAYGATE_URL)

logger.info('PAYGATE_URL', paygateUrl)

const bchNetwork = z
  .enum(['mainnet', 'testnet3', 'testnet4', 'chipnet', 'regtest'])
  .parse(appEnv.BCH_NETWORK)

logger.info('BCH_NETWORK', bchNetwork)
logger.info('INNGEST_BRANCH', appEnv.INNGEST_BRANCH)
logger.info('INNGEST_EVENT_KEY', appEnv.INNGEST_EVENT_KEY)
logger.info('INNGEST_SIGING_KEY', appEnv.INNGEST_SIGNING_KEY)
logger.info('REDIS_URL', appEnv.REDIS_URL)
logger.info('BCHOUSE_DATABASE_URL', appEnv.BCHOUSE_DATABASE_URL)

const searchService = new SearchService()

const redis = getRedis()
const abortController = new AbortController()

logger.info('Starting electrum')
const electrumService = await ElectrumNetworkProviderService.create(true)
logger.info('Started electrum')

logger.info('Starting campaign service 4')
const addressWatcher = new AddressWatcher()
await addressWatcher.start()
const campaignService = new CampaignService(electrumService, addressWatcher)
logger.info('Started campaign service')

const postService = new PostService(redis, searchService, campaignService)
const pledgeService = new PledgeService(campaignService)
const authService = new AuthService()
const feedService = new FeedService(redis)
const profileService = new ProfileService(redis, authService)
const userService = new UserService(redis, searchService)
const healthcheckService = new HealthcheckService()
const inngestService = new InngestService({
  campaignService,
})
const imageService = new ImageService()
const snowflakeId = new Snowflake({
  epoch: Number(appEnv.SNOWFLAKE_EPOCH),
  workerId: Number(appEnv.SNOWFLAKE_WORKER_ID),
})

// const unsubscribeCallback = await subscribeToTokenUpdates()

declare global {
  var destroyContext: () => Promise<void> | undefined
}

async function destroy() {
  logger.info('Destroying context')
  await pTimeout(
    Promise.all([
      (async () => electrumService.stop())(),
      (async () => addressWatcher.stop())(),
      // (async () => unsubscribeCallback())(),
    ]),
    {
      milliseconds: 5000,
      message: 'Destroy context timed out',
    }
  ).catch((err) => logger.error(err))
  logger.info('Destroyed context')
  abortController.abort('Server destroyed')
}

if (typeof globalThis.destroyContext !== 'undefined') {
  //Destroy if function exists
  await globalThis.destroyContext()
} else {
  //Setup handler if initial load
  const destoryFn = async () => {
    await globalThis.destroyContext?.()
    process.exit()
  }

  process.on('SIGINT', destoryFn)
  process.on('SIGTERM', () => destoryFn)
}

globalThis.destroyContext = destroy

export {
  authService,
  bchNetwork,
  bchouseUrl,
  campaignService,
  electrumService,
  feedService,
  healthcheckService,
  imageService,
  inngestService,
  paygateUrl,
  pledgeService,
  postService,
  profileService,
  ratelimit,
  redis as redisService,
  searchService,
  userService,
}
