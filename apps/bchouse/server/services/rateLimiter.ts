// Create a new ratelimiter, that allows 10 requests per 10 seconds
import { ActionFunctionArgs, LoaderFunctionArgs } from '@remix-run/node'
import { Ratelimit } from '@upstash/ratelimit'
import type { Redis } from '@upstash/redis'
import { RedisService } from './redis'

const redis = new RedisService()
const upstashRedisFacade = {
  hincrby: (key: string, field: string, increment: number) => {
    return redis.hincrby(key, field, increment)
  },
  sadd: <TData>(key: string, ...members: TData[]) =>
    redis.sadd(key, ...members.map((m) => String(m))),
  eval: async <TArgs extends unknown[], TData = unknown>(
    script: string,
    keys: string[],
    args: TArgs
  ) =>
    redis.eval(
      script,
      keys.length,
      ...keys,
      ...(args ?? []).map((a) => String(a))
    ) as Promise<TData>,
} as Pick<Redis, 'sadd' | 'eval' | 'hincrby'>

const appRateLimiter = new Ratelimit({
  redis: upstashRedisFacade,
  limiter: Ratelimit.slidingWindow(50, '10 s'),
  analytics: true,
  prefix: '@upstash/ratelimit/app',
})

const apiRateLimiter = new Ratelimit({
  redis: upstashRedisFacade,
  limiter: Ratelimit.slidingWindow(50, '10 s'),
  analytics: true,
  prefix: '@upstash/ratelimit/api',
})

const ratelimit = {
  async limitByIp(
    _: LoaderFunctionArgs | ActionFunctionArgs,
    type: 'app' | 'api',
    throwOnError = false,
    path?: string
  ) {
    const ip = _.context.ip as string | undefined

    if (!ip) {
      throw new Error('Invalid IP Address')
    }

    //TODO: limit by request ip address, path/route, and/or parameters.
    const identifier = path ? [ip, path].join(':') : ip

    const rateLimiter = type === 'app' ? appRateLimiter : apiRateLimiter
    const rateLimitResp = await rateLimiter.limit(identifier)

    if (!rateLimitResp.success && throwOnError) {
      throw new Response('Too many requests', {
        status: 429,
        headers: {
          'Retry-After': String(rateLimitResp.reset),
        },
      })
    }

    return rateLimitResp
  },
  async blockIpUntilReady(
    _: LoaderFunctionArgs | ActionFunctionArgs,
    timeout: number
  ) {
    const ip = _.context.ip as string | undefined

    if (!ip) {
      throw new Error('Invalid IP Address')
    }

    return appRateLimiter.blockUntilReady(ip, timeout)
  },
}

export { ratelimit }
