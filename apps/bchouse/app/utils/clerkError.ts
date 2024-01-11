export type ClerkError = {
  clerkError: true
  status: number
  errors: Array<{
    code: string
    message: string
    longMessage: string
    meta: {}
  }>
}

export function isClerkError(err: unknown): err is ClerkError {
  return (
    typeof err === 'object' &&
    err !== null &&
    'clerkError' in err &&
    !!err.clerkError
  )
}
