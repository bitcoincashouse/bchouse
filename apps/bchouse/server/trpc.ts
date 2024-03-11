import { AuthObject } from '@clerk/clerk-sdk-node'
import { initTRPC } from '@trpc/server'
import { CreateExpressContextOptions } from '@trpc/server/adapters/express'
import { getContext } from './services/getContext'

export type Context = Awaited<ReturnType<typeof createContext>>

const context = await getContext()
process.on('SIGINT', () => context.destroy().then(() => process.exit()))
process.on('SIGTERM', () => context.destroy().then(() => process.exit()))

export const createContext = ({ req, res }: CreateExpressContextOptions) => ({
  auth: (req as any).auth as AuthObject,
  ip: req.headers['Fly-Client-IP'] ?? req.socket.remoteAddress,
  req,
  res,
  ...context,
})

/**
 * Initialization of tRPC backend
 * Should be done only once per backend!
 */
const t = initTRPC.context<Context>().create()

/**
 * Export reusable router and procedure helpers
 * that can be used throughout the router
 */
export const router = t.router
export const publicProcedure = t.procedure
export const mergeRouters = t.mergeRouters
export const createCallerFactory = t.createCallerFactory
export const createCallerContext = ({
  req,
  res,
}: Omit<CreateExpressContextOptions, 'info'>) => ({
  auth: (req as any).auth as AuthObject,
  ip: req.headers['Fly-Client-IP'] ?? req.socket.remoteAddress,
  req,
  res,
  ...context,
})
