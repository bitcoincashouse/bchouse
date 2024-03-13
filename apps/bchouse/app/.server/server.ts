import { logger } from '@bchouse/utils'
import { ClerkExpressWithAuth } from '@clerk/clerk-sdk-node'
import { createRequestHandler as expressCreateRequestHandler } from '@remix-run/express'
import { installGlobals } from '@remix-run/node'
import { wrapExpressCreateRequestHandler } from '@sentry/remix'
import { createServerSideHelpers } from '@trpc/react-query/server'
import { createExpressMiddleware } from '@trpc/server/adapters/express'
import compression from 'compression'
import express from 'express'
import gracefulShutdown from 'http-graceful-shutdown'
import morgan from 'morgan'
import * as path from 'node:path'
import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { appRouter } from './router/index'
import { createCallerContext, createContext } from './trpc'

const createRequestHandler = wrapExpressCreateRequestHandler(
  expressCreateRequestHandler
)

logger.info('Starting server...')

installGlobals()

const currentModuleUrl = import.meta.url
const currentModulePath = fileURLToPath(currentModuleUrl)
const currentModuleDirectory = dirname(currentModulePath)

const BUILD_DIR = path.resolve(currentModuleDirectory, '../build/')
const CLIENT_BUILD_PATH = path.resolve(BUILD_DIR, './client')
const CLIENT_ASSETS_PATH = path.resolve(CLIENT_BUILD_PATH, './assets')
const SERVER_BUILD_PATH = path.join(BUILD_DIR, './server/index.js')

async function createAppRoutes() {
  const app = express()
  app.use(compression())

  // http://expressjs.com/en/advanced/best-practice-security.html#at-a-minimum-disable-x-powered-by-header
  app.disable('x-powered-by')

  app.use(ClerkExpressWithAuth())
  app.use(
    '/trpc',
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  )

  const getLoadContext = (req: express.Request, res: express.Response) => {
    const trpc = createServerSideHelpers({
      router: appRouter,
      ctx: createCallerContext({ req, res }),
    })

    return {
      trpc,
      getDehydratedState: () => {
        return {
          dehydratedState: trpc.dehydrate(),
        }
      },
    }
  }

  let requestHandler

  if (process.env.NODE_ENV === 'production') {
    app.use('/assets', express.static(CLIENT_ASSETS_PATH, { maxAge: '1y' }))

    requestHandler = createRequestHandler({
      build: await import(SERVER_BUILD_PATH),
      mode: process.env.NODE_ENV,
      getLoadContext,
    })
  } else {
    const viteDevServer = await import('vite').then((vite) =>
      vite.createServer({
        server: { middlewareMode: true },
      })
    )

    app.use(viteDevServer.middlewares)

    requestHandler = createRequestHandler({
      build: () => viteDevServer.ssrLoadModule('virtual:remix/server-build'),
      mode: 'development',
      getLoadContext,
    })
  }

  app.use(express.static(CLIENT_BUILD_PATH, { maxAge: '1h' }))

  app.use(
    morgan('tiny', {
      skip: (req) => {
        if (req.method === 'PUT' && req.url === '/api/inngest') {
          return true
        }

        return false
      },
    })
  )

  app.use('*', requestHandler)

  return app
}

async function startup() {
  logger.info('SERVER_BUILD_PATH:', SERVER_BUILD_PATH)
  logger.info('CLIENT_BUILD_PATH:', CLIENT_BUILD_PATH)
  logger.info('CLIENT_ASSETS_PATH:', CLIENT_ASSETS_PATH)

  const app = await createAppRoutes()
  const port = process.env.BCHOUSE_PORT || 3000
  const server = app.listen(port, async () => {
    logger.info(`Express server listening on port ${port}`)
  })

  gracefulShutdown(server, {
    signals: 'SIGINT SIGTERM',
    timeout: 30000,
    development: process.env.NODE_ENV === 'development',
    onShutdown: async () => {
      logger.info('Server is gracefully shutting down.')
    },
    finally: () => {
      logger.info('Server closed.')
    },
  })
}

startup()
