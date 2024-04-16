import autocompleteCss from '@algolia/autocomplete-theme-classic/dist/theme.min.css?url'
import { moment } from '@bchouse/utils'
import { ClerkApp, ClerkErrorBoundary, useAuth, useClerk } from '@clerk/remix'
import { rootAuthLoader } from '@clerk/remix/ssr.server'
import {
  LoaderFunctionArgs,
  type LinksFunction,
  type MetaFunction,
} from '@remix-run/node'
import {
  ClientLoaderFunctionArgs,
  Outlet,
  ShouldRevalidateFunctionArgs,
  useLocation,
  useNavigate,
  useRevalidator,
} from '@remix-run/react'
import { metaV1 } from '@remix-run/v1-meta'
import { withSentry } from '@sentry/remix'
import {
  HydrationBoundary,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query'
import { httpBatchLink } from '@trpc/client'
import {
  CreateTRPCClient,
  createTRPCClient,
  createTRPCQueryUtils,
  getQueryKey,
} from '@trpc/react-query'
import { CreateQueryUtils } from '@trpc/react-query/shared'
import { Buffer } from 'buffer-polyfill'
import { useEffect, useRef, useState } from 'react'
import { UseDataFunctionReturn, useTypedLoaderData } from 'remix-typedjson'
import { appEnv } from '~/.server/appEnv'
import { AppRouter } from '~/.server/types/router'
import stylesheet from '~/index.css?url'
import { ErrorDisplay } from './components/pages/error'
import { WalletConnectSessionProvider } from './components/utils/wc2-provider'
import { Document } from './document'
import { getThemeSession } from './utils/themeCookie.server'
import { trpc } from './utils/trpc'
import { useDehydratedState } from './utils/useDehydratedState'

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

export const loader = async (_: LoaderFunctionArgs) => {
  return rootAuthLoader(_, async ({ request }) => {
    const { sessionId, userId, getToken } = request.auth
    const themeSession = await getThemeSession(request)

    return {
      sessionId,
      userId,
      theme: themeSession.getTheme(),
      BCH_NETWORK: appEnv.BCH_NETWORK,
      SENTRY_DSN: appEnv.SENTRY_DSN,
      PAYGATE_URL: appEnv.PAYGATE_URL,
      BCHOUSE_URL: appEnv.BCHOUSE_URL,
      WALLET_CONNECT_PROJECT_ID: appEnv.WALLET_CONNECT_PROJECT_ID,
      FLIPSTARTER_PLATFORM_ADDRESS: process.env.FLIPSTARTER_PLATFORM_ADDRESS,
      TYPESENSE_PUBLIC_URL: appEnv.TYPESENSE_PUBLIC_URL,
      TYPESENSE_PUBLIC_API_KEY: appEnv.TYPESENSE_PUBLIC_API_KEY,
    }
  })
}

export const clientLoader = async (_: ClientLoaderFunctionArgs) => {
  return window.env
}

export const shouldRevalidate = async (_: ShouldRevalidateFunctionArgs) => {
  return false
}

export const ErrorBoundary = withSentry(
  ClerkErrorBoundary(function () {
    return (
      <Document specifiedTheme={null}>
        <div className="flex justify-center items-center">
          <ErrorDisplay page={'root'} />
        </div>
      </Document>
    )
  })
)

declare global {
  interface Window {
    env: UseDataFunctionReturn<typeof loader>
    queryClient: QueryClient
    trpcClient: CreateTRPCClient<AppRouter>
    trpcClientUtils: CreateQueryUtils<AppRouter>
    clerk: ReturnType<typeof useClerk>
  }
}

const App = function () {
  const [queryClient] = useState(() => {
    const queryClient = new QueryClient()
    if (typeof window !== 'undefined') {
      window.queryClient = queryClient
    }

    return queryClient
  })

  const { getToken } = useAuth()
  const [trpcClient] = useState(() => {
    const trpcClient = trpc.createClient({
      links: [
        httpBatchLink({
          url: '/trpc',
          // You can pass any HTTP headers you wish here
          async fetch(url, options) {
            const token = await getToken()

            return fetch(url, {
              ...options,
              credentials: 'include',
              headers: {
                ...options?.headers,
                Authorization: `Bearer ${token}`,
              },
            })
          },
        }),
      ],
    })

    if (typeof window !== 'undefined') {
      window.trpcClient = createTRPCClient({
        links: [
          httpBatchLink({
            url: '/trpc',
            // You can pass any HTTP headers you wish here
            async fetch(url, options) {
              const token = await getToken()

              return fetch(url, {
                ...options,
                credentials: 'include',
                headers: {
                  ...options?.headers,
                  Authorization: `Bearer ${token}`,
                },
              })
            },
          }),
        ],
      })

      window.trpcClientUtils = createTRPCQueryUtils({
        queryClient,
        client: trpcClient,
      })

      queryClient.setQueryDefaults(getQueryKey(trpc.post.getPost), {
        gcTime: Infinity,
      })

      queryClient.setQueryDefaults(getQueryKey(trpc.post.feed), {
        gcTime: Infinity,
      })
    }

    return trpcClient
  })

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
    if (typeof window !== 'undefined') {
      window.clerk = clerk
    }

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

  const dehydratedState = useDehydratedState()

  return (
    <Document specifiedTheme={env.theme}>
      <trpc.Provider client={trpcClient} queryClient={queryClient}>
        <QueryClientProvider client={queryClient}>
          <HydrationBoundary state={dehydratedState}>
            <WalletConnectSessionProvider>
              <Outlet />
            </WalletConnectSessionProvider>
          </HydrationBoundary>
        </QueryClientProvider>
        <script src="//cdn.iframe.ly/embed.js?" />
        <script
          dangerouslySetInnerHTML={{
            __html: `window.env = ${JSON.stringify(env)}`,
          }}
        />
      </trpc.Provider>
    </Document>
  )
}

export default ClerkApp(App)
