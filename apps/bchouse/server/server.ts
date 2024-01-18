import type { RequestHandler } from '@remix-run/express'
import { createRequestHandler as expressCreateRequestHandler } from '@remix-run/express'
import { broadcastDevReady, installGlobals } from '@remix-run/node'
import { wrapExpressCreateRequestHandler } from '@sentry/remix'
import chokidar from 'chokidar'
import compression from 'compression'
import express from 'express'
import gracefulShutdown from 'http-graceful-shutdown'
import morgan from 'morgan'
import * as fs from 'node:fs'
import * as path from 'node:path'
import { dirname } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { logger } from '../app/utils/logger'

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
const CONTEXT_PATH = path.join(BUILD_DIR, 'getContext.js')
console.log('BUILD_PATH:', BUILD_DIR)

const app = express()

app.use(compression())

// http://expressjs.com/en/advanced/best-practice-security.html#at-a-minimum-disable-x-powered-by-header
app.disable('x-powered-by')

// Remix fingerprints its assets so we can cache forever.
app.use(
  '/build',
  express.static(BUILD_ASSETS_DIR, { immutable: true, maxAge: '1y' })
)

// Everything els e (like favicon.ico) is cached for an hour. You may want to be
// more aggressive with this caching.
app.use(express.static(ASSETS_DIR, { maxAge: '1h' }))

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
  const BUILD_URL = pathToFileURL(BUILD_PATH).href
  const CONTEXT_URL = pathToFileURL(CONTEXT_PATH).href
  let build = await import(BUILD_URL)
  let context = await import(CONTEXT_URL).then((mod) => mod.getContext())

  app.all(
    '*',
    process.env.NODE_ENV === 'development'
      ? createDevRequestHandler()
      : createRequestHandler({
          build: build,
          mode: process.env.NODE_ENV,
          async getLoadContext() {
            return context
          },
        })
  )

  function createDevRequestHandler(): RequestHandler {
    const updater = async function (path: string) {
      try {
        const isContextUpdate = path === CONTEXT_PATH

        if (isContextUpdate) {
          await context
            ?.destroy()
            .catch(() => logger.error('Failed to destroy old context'))

          logger.info('Creating new context')
          const stat = fs.statSync(CONTEXT_PATH)
          const CONTEXT_URL = pathToFileURL(CONTEXT_PATH).href
          context = await import(CONTEXT_URL + '?t=' + stat.mtimeMs).then(
            (mod) => mod.getContext()
          )
        }

        //Always create new front-end build
        logger.info('Creating new build')
        const stat = fs.statSync(BUILD_PATH)
        const BUILD_URL = pathToFileURL(BUILD_PATH).href
        build = await import(BUILD_URL + '?t=' + stat.mtimeMs)
        broadcastDevReady(build)
      } catch (err) {
        logger.error('Server HMR failed', err)
      }
    }

    chokidar
      .watch([BUILD_PATH, CONTEXT_PATH], { ignoreInitial: true })
      .on('add', debounce(updater))
      .on('change', debounce(updater))

    return async (req, res, next) => {
      try {
        return createRequestHandler({
          build: build,
          mode: 'development',
          async getLoadContext() {
            return context
          },
        })(req, res, next)
      } catch (error) {
        next(error)
      }
    }
  }

  // await reindex()
  // await createDefaultCoverImage()

  const port = process.env.BCHOUSE_PORT || 3000
  const server = app.listen(port, async () => {
    logger.info(`Express server listening on port ${port}`)

    if (process.env.NODE_ENV === 'development') {
      broadcastDevReady(build)
    }
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
