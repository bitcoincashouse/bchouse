// learn more: https://fly.io/docs/reference/configuration/#services-http_checks
import { logger } from '@bchouse/utils'
import type { LoaderFunctionArgs } from '@remix-run/node'

export const loader = async (_: LoaderFunctionArgs) => {
  try {
    return new Response('OK')
  } catch (error: unknown) {
    logger.error('healthcheck ❌', { error })
    return new Response('ERROR', { status: 500 })
  }
}
