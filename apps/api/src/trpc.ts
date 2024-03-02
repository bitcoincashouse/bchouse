import { AuthObject } from '@clerk/clerk-sdk-node'
import { initTRPC } from '@trpc/server'
import { CreateExpressContextOptions } from '@trpc/server/adapters/express'

export type Context = Awaited<ReturnType<typeof createContext>>
export const createContext = ({ req, res }: CreateExpressContextOptions) => ({
  auth: (req as any).auth as AuthObject,
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
