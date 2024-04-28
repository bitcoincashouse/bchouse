import {
  Client,
  cacheExchange,
  fetchExchange,
  subscriptionExchange,
} from '@urql/core'
import { createClient as createWSClient } from 'graphql-ws'
import WebSocket from 'ws'
import { appEnv } from '~/.server/appEnv'

const wsClient = createWSClient({
  url: appEnv.CHAINGRAPH_WS_URL,
  webSocketImpl: WebSocket,
  keepAlive: 30 * 1000,
})

export const client = new Client({
  url: appEnv.CHAINGRAPH_HTTP_URL,
  exchanges: [
    cacheExchange,
    fetchExchange,
    subscriptionExchange({
      forwardSubscription(request) {
        const input = { ...request, query: request.query || '' }
        return {
          subscribe(sink) {
            const unsubscribe = wsClient.subscribe(input, sink)
            return { unsubscribe }
          },
        }
      },
    }),
  ],
})
