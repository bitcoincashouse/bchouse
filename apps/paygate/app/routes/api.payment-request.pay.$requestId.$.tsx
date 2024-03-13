import { logger } from '@bchouse/utils'
import { ActionFunctionArgs, LoaderFunctionArgs } from '@remix-run/node'
import { z } from 'zod'
import { paygateService } from '~/.server/getContext'
import { cors } from '~/utils/cors'
import { zx } from '~/utils/zodix'

export async function loader(_: LoaderFunctionArgs) {
  return handlePaymentError(async () => {
    if (_.request.method.toLowerCase() === 'options') {
      return await cors(_.request, new Response('ok', { status: 200 }))
    }

    const headers = JSON.stringify({
      headers: Object.fromEntries(_.request.headers.entries()),
    })

    logger.info('Incoming payment loader', _.request.url, headers)

    const { requestId } = zx.parseParams(_.params, {
      requestId: z.string(),
    })

    return await paygateService.handlePaymentRequest(requestId, {
      method: 'GET',
      headers: _.request.headers,
      body: await _.request.arrayBuffer(),
    })
  })
}

export async function action(_: ActionFunctionArgs) {
  return handlePaymentError(async () => {
    const headers = JSON.stringify({
      headers: Object.fromEntries(_.request.headers.entries()),
    })

    logger.info('Incoming payment action', _.request.url, headers)

    const { requestId } = zx.parseParams(_.params, {
      requestId: z.string(),
    })

    return paygateService.handlePaymentRequest(requestId, {
      method: 'POST',
      headers: _.request.headers,
      body: await _.request.arrayBuffer(),
    })
  })
}

async function handlePaymentError(fn: () => Promise<Response>) {
  try {
    return await fn()
  } catch (err) {
    let errorMessage = 'Unknown error'

    if (err instanceof Error) {
      logger.error('Error accepting payment:', err.stack)
      errorMessage = err.message
    } else if (typeof err === 'string') {
      logger.error('Error accepting payment:', err)
      errorMessage = err
    } else if (
      typeof err === 'object' &&
      err !== null &&
      'message' in err &&
      typeof err.message === 'string'
    ) {
      logger.error('Error accepting payment:', err.message)
      errorMessage = err.message
    }

    return new Response(errorMessage, {
      status: 500,
    })
  }
}
