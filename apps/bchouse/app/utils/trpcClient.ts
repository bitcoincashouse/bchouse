import type { AppRouter } from '@bchouse/api'
import { constants } from '@clerk/clerk-sdk-node'
import { createTRPCClient, httpLink } from '@trpc/client'
import { parse } from 'cookie'

let apiUrl = ((process.env.API_URL as string) || '').replace(/\/$/, '')

if (process.env.NODE_ENV !== 'production' && !apiUrl) {
  apiUrl = 'localhost:3003'
}

export const getTrpc = (request: Request) =>
  createTRPCClient<AppRouter>({
    links: [
      httpLink({
        url: apiUrl + '/trpc',
        headers(opts) {
          const cookieStr = request.headers.get('Cookie') as string
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
