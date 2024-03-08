import type { AppRouter } from '@bchouse/api'
import { constants } from '@clerk/clerk-sdk-node'
import { createTRPCClient, httpLink } from '@trpc/client'
import { createServerSideHelpers } from '@trpc/react-query/server'
import { parse } from 'cookie'
import type { Request } from 'express'
let apiUrl = ((process.env.API_URL as string) || '').replace(/\/$/, '')

if (process.env.NODE_ENV !== 'production' && !apiUrl) {
  apiUrl = 'http://localhost:3003'
}

export const getServerClient = (request: Request) => {
  const proxyClient = createTRPCClient<AppRouter>({
    links: [
      httpLink({
        url: apiUrl + '/trpc',
        headers(opts) {
          const cookieStr = request.headers.cookie as string
          if (cookieStr) {
            const cookies = parse(cookieStr)
            const jwt = cookies[constants.Cookies.Session]

            return {
              Authorization: `Bearer ${jwt}`,
            }
          }

          return {}
        },
        fetch(url, options) {
          return fetch(url, {
            ...options,
            credentials: 'include',
          })
        },
      }),
    ],
  })

  return createServerSideHelpers({
    client: proxyClient,
  })
}
