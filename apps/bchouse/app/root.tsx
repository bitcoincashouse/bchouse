import autocompleteCss from '@algolia/autocomplete-theme-classic/dist/theme.min.css'
import { ClerkApp, ClerkErrorBoundary, useClerk } from '@clerk/remix'
import { rootAuthLoader } from '@clerk/remix/ssr.server'
import {
  LoaderArgs,
  type LinksFunction,
  type MetaFunction,
} from '@remix-run/node'
import {
  Outlet,
  useLocation,
  useNavigate,
  useRevalidator,
} from '@remix-run/react'
import { metaV1 } from '@remix-run/v1-meta'
import { withSentry } from '@sentry/remix'
import { QueryClientProvider } from '@tanstack/react-query'
import { Buffer } from 'buffer-polyfill'
import { useEffect, useRef } from 'react'
import { UseDataFunctionReturn, useTypedLoaderData } from 'remix-typedjson'
import stylesheet from '~/styles/tailwind.css'
import { ErrorDisplay } from './components/pages/error'
import { Document } from './document'
import moment from './utils/moment'
import { queryClient } from './utils/query-client'
import { getThemeSession } from './utils/themeCookie.server'

if (typeof window !== 'undefined') {
  //@ts-ignore
  window.Buffer = Buffer
  if (!Array.prototype.at) {
    Object.defineProperty(Array.prototype, 'at', {
      value: function at(this: any, n: number) {
        n = Math.trunc(n) || 0
        if (n < 0) n += this.length
        if (n < 0 || n >= this.length) return undefined
        return this[n]
      },
      writable: true,
      enumerable: false,
      configurable: true,
    })
  }
}

export const links: LinksFunction = () => [
  { rel: 'stylesheet', href: stylesheet },
  { rel: 'stylesheet', href: autocompleteCss },
]

export const meta: MetaFunction = (_) => {
  return metaV1(
    { ..._, matches: [] },
    {
      charset: 'utf-8',
      title: 'BCHouse',
      viewport: 'width=device-width,initial-scale=1',
    }
  )
}

export const loader = async (_: LoaderArgs) => {
  return rootAuthLoader(_, async ({ request }) => {
    const { sessionId, userId, getToken } = request.auth
    const themeSession = await getThemeSession(request)

    return {
      sessionId,
      userId,
      theme: themeSession.getTheme(),
      BCH_NETWORK: _.context.bchNetwork,
      SENTRY_DSN: process.env.SENTRY_DSN as string,
      PAYGATE_URL: (process.env.PAYGATE_URL as string).replace(/\/$/, ''),
      BCHOUSE_URL: (process.env.BCHOUSE_URL as string).replace(/\/$/, ''),
      FLIPSTARTER_PLATFORM_ADDRESS: process.env
        .FLIPSTARTER_PLATFORM_ADDRESS as string,
      TYPESENSE_PUBLIC_URL: process.env.TYPESENSE_PUBLIC_URL,
      TYPESENSE_PUBLIC_API_KEY: process.env.TYPESENSE_PUBLIC_API_KEY,
    }
  })
}

export const ErrorBoundary = withSentry(
  ClerkErrorBoundary(function () {
    return (
      <Document specifiedTheme={null}>
        <ErrorDisplay page={'root'} />
      </Document>
    )
  })
)

declare global {
  interface Window {
    env: UseDataFunctionReturn<typeof loader>
  }
}

const App = function () {
  const env = useTypedLoaderData<typeof loader>()
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    // Remove trailing slash
    if (location.pathname !== '/' && location.pathname.slice(-1)[0] === '/') {
      navigate(
        `${location.pathname.slice(0, -1)}${location.search}${location.hash}`,
        { state: location.state, replace: true }
      )
    }
  }, [location])

  const clerk = useClerk()
  const { revalidate } = useRevalidator()
  const lastUpdatedRef = useRef<Date>()

  useEffect(() => {
    lastUpdatedRef.current = moment().toDate()
  }, [])

  useEffect(() => {
    console.log('CLERK SUBSCRIBE')
    const unsubscribe = clerk.addListener((resources) => {
      console.log('CLERK UPDATE', resources)

      if (
        lastUpdatedRef.current &&
        clerk.user?.updatedAt &&
        lastUpdatedRef.current <= clerk.user.updatedAt
      ) {
        lastUpdatedRef.current = clerk.user.updatedAt

        console.log('UPDATING DUE TO CLERK')
        revalidate()
      }
    })

    return () => {
      console.log('CLERK UNSUBSCRIBE')
      unsubscribe()
    }
  }, [])

  return (
    <Document specifiedTheme={env.theme}>
      <QueryClientProvider client={queryClient}>
        <Outlet />
      </QueryClientProvider>
      <script src="//cdn.iframe.ly/embed.js?" />
      <script
        dangerouslySetInnerHTML={{
          __html: `window.env = ${JSON.stringify(env)}`,
        }}
      />
    </Document>
  )
}

export default ClerkApp(App)
