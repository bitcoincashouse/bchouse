// learn more: https://fly.io/docs/reference/configuration/#services-http_checks
import type { LoaderArgs } from '@remix-run/node'
import { logger } from '~/utils/logger'

export const loader = async (_: LoaderArgs) => {
  const host =
    _.request.headers.get('X-Forwarded-Host') ?? _.request.headers.get('host')

  try {
    // if we can connect to the database and make a simple query
    // and make a HEAD request to ourselves, then we're good.
    await _.context.healthcheckService.checkHealth(host as string)
    return new Response('OK')
  } catch (error: unknown) {
    logger.error('healthcheck ❌', { error })
    return new Response('ERROR', { status: 500 })
  }
}
