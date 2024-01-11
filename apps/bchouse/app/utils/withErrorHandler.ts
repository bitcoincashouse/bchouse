import { LoaderArgs, redirect } from '@remix-run/node'
import HttpStatus from '~/utils/http-status'
import { logger } from '~/utils/logger'

type Loader<T> = (args: LoaderArgs) => Promise<T>

export class InternalServerError extends Error {
  code: number
  redirect: string | undefined

  constructor(
    args:
      | {
          redirect?: string
          code: number
          message: string
        }
      | number
  ) {
    const isStructuredError = typeof args === 'object'
    const code = isStructuredError ? args.code : args

    const httpStatusCode = HttpStatus[code]
      ? code
      : HttpStatus.INTERNAL_SERVER_ERROR
    const statusMessage = HttpStatus[httpStatusCode]

    if (isStructuredError) {
      super(statusMessage + ': ' + args.message)
    } else {
      super(statusMessage)
    }

    this.redirect = isStructuredError ? args.redirect : undefined
    this.code = httpStatusCode
  }
}

export function withErrorHandler<T>(loader: Loader<T>) {
  return async (args: LoaderArgs) => {
    try {
      return await loader(args)
    } catch (err) {
      if (err instanceof InternalServerError) {
        logger.error(err.stack)

        throw err.redirect
          ? redirect(err.redirect)
          : new Response(err.message, {
              status: err.code,
              statusText: err.message,
            })
      } else if (err instanceof Response) {
        //TODO God willing: update these paths to throw custom errors for logging
        logger.error('Unknown error response:', args.request.url)
        throw err
      } else {
        logger.error('Unknown error', err, (err as any).stack)

        throw new Response('An unknown error occurred', {
          status: 500,
          statusText: 'Internal Server Error',
        })
      }
    }
  }
}
