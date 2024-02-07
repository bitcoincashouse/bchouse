import pTimeout from 'p-timeout'
import { z } from 'zod'
import { logger } from '../app/utils/logger'
import { AddressWatcher } from './services/address-watcher'
import { AuthService } from './services/auth'
import { CampaignService } from './services/campaign'
import { FeedService } from './services/feed'
import { HealthcheckService } from './services/healthcheck'
import { ImageService } from './services/image'
import { InngestService } from './services/inngest'
import { PledgeService } from './services/pledge'
import { PostService } from './services/post'
import { ProfileService } from './services/profile'
import { ratelimit } from './services/rateLimiter'
import { getRedis } from './services/redis'
import { SearchService } from './services/search'
import { UserService } from './services/user'
import { ElectrumNetworkProviderService } from './utils/getElectrumProvider'

export type Context = Awaited<ReturnType<typeof getContext>>

export async function getContext() {
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

  const bchNetwork = z
    .enum(['mainnet', 'testnet3', 'testnet4', 'chipnet', 'regtest'])
    .parse(process.env.BCH_NETWORK)

  logger.info('BCH_NETWORK', bchNetwork)
  logger.info('INNGEST_BRANCH', process.env.INNGEST_BRANCH)
  logger.info('INNGEST_EVENT_KEY', process.env.INNGEST_EVENT_KEY)
  logger.info('INNGEST_SIGING_KEY', process.env.INNGEST_SIGNING_KEY)
  logger.info('REDIS_URL', process.env.REDIS_URL)
  logger.info('BCHOUSE_DATABASE_URL', process.env.BCHOUSE_DATABASE_URL)

  const searchService = new SearchService()
  if (process.env.TYPESENSE_REBUILD_INDEX === 'true') {
    await searchService.reindex()
  }

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

  return {
    signal: abortController.signal,
    electrumService,
    bchouseUrl,
    ratelimit,
    paygateUrl,
    bchNetwork,
    redisService: redis,
    campaignService,
    pledgeService,
    feedService: new FeedService(redis),
    imageService: new ImageService(),
    postService,
    profileService: new ProfileService(redis, authService),
    userService: new UserService(redis, searchService),
    healthcheckService: new HealthcheckService(),
    authService,
    inngestService: new InngestService({
      campaignService,
    }),
    searchService: searchService,
    async destroy() {
      logger.info('Destroying context')
      await pTimeout(
        Promise.all([electrumService.stop(), addressWatcher.stop()]),
        { milliseconds: 5000, message: 'Destroy context timed out' }
      ).catch((err) => logger.error(err))
      logger.info('Destroyed context')
      abortController.abort('Server destroyed')
    },
  }
}
