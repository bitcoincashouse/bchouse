// learn more: https://fly.io/docs/reference/configuration/#services-http_checks
import { logger } from '@bchouse/utils'
import type { LoaderFunctionArgs } from '@remix-run/node'
import { healthcheckService } from '~/.server/getContext'

export const loader = async (_: LoaderFunctionArgs) => {
  const host =
    _.request.headers.get('X-Forwarded-Host') ?? _.request.headers.get('host')

  try {
    // if we can connect to the database and make a simple query
    // and make a HEAD request to ourselves, then we're good.
    await healthcheckService.checkHealth(host as string)
    return new Response('OK')
  } catch (error: unknown) {
    logger.error('healthcheck ❌', { error })
    return new Response('ERROR', { status: 500 })
  }
}
