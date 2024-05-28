import autocompleteCss from '@algolia/autocomplete-theme-classic/dist/theme.min.css?url'
import { ClerkApp, ClerkErrorBoundary } from '@clerk/remix'
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
} from '@remix-run/react'
import { metaV1 } from '@remix-run/v1-meta'
import { withSentry } from '@sentry/remix'
import { HydrationBoundary, QueryClientProvider } from '@tanstack/react-query'
import { UseDataFunctionReturn, useTypedLoaderData } from 'remix-typedjson'
import { appEnv } from '~/.server/appEnv'
import stylesheet from '~/index.css?url'
import { ErrorDisplay } from './components/pages/error'
import { WalletConnectSessionProvider } from './components/utils/wc2-provider'
import { Document } from './document'
import { initGlobals } from './root/initGlobals'
import { useClerkSubscription } from './root/useClerkSubscription'
import { useQueryClient } from './root/useQueryClient'
import { useRemixQuery } from './root/useRemixQuery'
import { useRemoveTrailingSlash } from './root/useRemoveTrailingSlash'
import { getThemeSession } from './utils/themeCookie.server'
import { useDehydratedState } from './utils/useDehydratedState'

declare global {
  interface Window {
    env: UseDataFunctionReturn<typeof loader>
  }
}

initGlobals()

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
      UMBRACO_URL: appEnv.UMBRACO_URL,
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

const App = function () {
  const env = useTypedLoaderData<typeof loader>()
  const queryClient = useQueryClient()
  useRemixQuery(queryClient)
  useRemoveTrailingSlash()
  useClerkSubscription()

  const dehydratedState = useDehydratedState()

  return (
    <Document specifiedTheme={env.theme}>
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
    </Document>
  )
}

export default ClerkApp(App)
