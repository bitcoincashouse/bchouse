import { logger } from '@bchouse/utils'
import { Link, isRouteErrorResponse, useRouteError } from '@remix-run/react'

export const meta = () => ({
  charset: 'utf-8',
  title: 'BCHouse',
  viewport: 'width=device-width,initial-scale=1',
})

export function ErrorDisplay({ page }: { page?: string }) {
  const error = useRouteError()
  const isRouteError = isRouteErrorResponse(error)
  const title = isRouteError ? 'Internal server error' : 'Unknown error'
  logger.error('Render error:', error)

  // Don't forget to typecheck with your own logic.
  // Any value can be thrown, not just errors!
  let errorMessage = ['Unknown error', page].filter(Boolean).join(': ')

  if (error instanceof Error) {
    errorMessage = error.message
  }

  return (
    <main className="grid min-h-full place-items-center px-6 py-24 sm:py-32 lg:px-8">
      <div className="text-center">
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-primary-text sm:text-5xl">
          {title}
        </h1>
        <p className="mt-6 text-base leading-7 text-gray-600">
          Sorry, something went wrong.
        </p>

        {process.env.NODE_ENV === 'development' ? (
          <p className="mt-2 text-sm leading-7 text-gray-600">
            Details: {errorMessage}
          </p>
        ) : (
          <></>
        )}

        <div className="mt-10 flex items-center justify-center gap-x-6">
          <Link
            to="/"
            className="rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            Go back home
          </Link>
          <a
            href="mailto:sahid.miller@gmail.com"
            className="text-sm font-semibold text-primary-text"
          >
            Contact support <span aria-hidden="true">&rarr;</span>
          </a>
        </div>
      </div>
    </main>
  )
}
