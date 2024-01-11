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

export function isApplicationError(err: unknown): err is ApplicationError {
  return (
    typeof err === 'object' &&
    err !== null &&
    'applicationError' in err &&
    !!err.applicationError
  )
}
