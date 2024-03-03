import { HttpStatus } from './http-status'

type AppError = {
  code: string
  message: string
  longMessage: string
  meta: {}
}

export class ApplicationError extends Error {
  applicationError = true
  status: number
  errors: Array<AppError>

  constructor(errors: [AppError, ...AppError[]]) {
    super(errors[0].message)
    this.errors = errors
  }
}

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

export function isApplicationError(err: unknown): err is ApplicationError {
  return (
    typeof err === 'object' &&
    err !== null &&
    'applicationError' in err &&
    !!err.applicationError
  )
}
