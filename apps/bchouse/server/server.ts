import { logger } from '@bchouse/utils'
import { createRequestHandler as expressCreateRequestHandler } from '@remix-run/express'
import { installGlobals } from '@remix-run/node'
import { wrapExpressCreateRequestHandler } from '@sentry/remix'
import compression from 'compression'
import express from 'express'
import gracefulShutdown from 'http-graceful-shutdown'
import morgan from 'morgan'
import * as path from 'node:path'
import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { getServerClient } from '~/utils/trpc.server'

const createRequestHandler = wrapExpressCreateRequestHandler(
  expressCreateRequestHandler
)

logger.info('Starting server...')

installGlobals()

const currentModuleUrl = import.meta.url
const currentModulePath = fileURLToPath(currentModuleUrl)
const currentModuleDirectory = dirname(currentModulePath)

const BUILD_DIR = path.resolve(currentModuleDirectory, '../build/')
const ASSETS_DIR = path.resolve(currentModuleDirectory, '../public')
const BUILD_ASSETS_DIR = path.resolve(ASSETS_DIR, './public')
const BUILD_PATH = path.join(BUILD_DIR, 'index.js')

const app = express()

app.use(compression())

// http://expressjs.com/en/advanced/best-practice-security.html#at-a-minimum-disable-x-powered-by-header
app.disable('x-powered-by')

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

const debounce = (fn: Function, ms = 500) => {
  let timeoutId: ReturnType<typeof setTimeout>
  return function (this: any, ...args: any[]) {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => fn.apply(this, args), ms)
  }
}

function isDescendant(childPath: string, parentPath: string) {
  const relativePath = path.relative(parentPath, childPath)
  return !relativePath.startsWith('..') && !path.isAbsolute(relativePath)
}

async function startup() {
  logger.info('BUILD_PATH:', BUILD_PATH)
  // let build = await import(pathToFileURL(BUILD_PATH).href)

  let requestHandler
  if (process.env.NODE_ENV === 'production') {
    app.use('/assets', express.static('build/client/assets', { maxAge: '1y' }))

    requestHandler = createRequestHandler({
      build: await import('./build/server/index.js'),
      mode: process.env.NODE_ENV,
      getLoadContext(req: express.Request) {
        const trpc = getServerClient(req)

        return {
          trpc,
          getDehydratedState: () => {
            return {
              dehydratedState: trpc.dehydrate(),
            }
          },
        }
      },
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
      getLoadContext(req: express.Request) {
        const trpc = getServerClient(req)

        return {
          trpc,
          getDehydratedState: () => {
            return {
              dehydratedState: trpc.dehydrate(),
            }
          },
        }
      },
    })
  }

  app.use(express.static('build/client', { maxAge: '1h' }))

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
