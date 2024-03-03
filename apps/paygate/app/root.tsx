import { moment } from '@bchouse/utils'
import {
  LoaderFunctionArgs,
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
import { Buffer } from 'buffer-polyfill'
import { useEffect, useRef } from 'react'
import { UseDataFunctionReturn, useTypedLoaderData } from 'remix-typedjson'
import { ErrorDisplay } from './components/pages/error'
import { Document } from './document'

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

export const links: LinksFunction = () => []

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
  return {
    BCHOUSE_URL: (process.env.BCHOUSE_URL as string).replace(/\/$/, ''),
    PAYGATE_URL: (process.env.PAYGATE_URL as string).replace(/\/$/, ''),
  }
}

export const ErrorBoundary = function () {
  return (
    <Document>
      <ErrorDisplay page={'root'} />
    </Document>
  )
}

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

  const { revalidate } = useRevalidator()
  const lastUpdatedRef = useRef<Date>()

  useEffect(() => {
    lastUpdatedRef.current = moment().toDate()
  }, [])

  return (
    <Document>
      <Outlet />
      <script
        dangerouslySetInnerHTML={{
          __html: `window.env = ${JSON.stringify(env)}`,
        }}
      />
    </Document>
  )
}

export default App
