import { AuthObject } from '@clerk/clerk-sdk-node'
import { initTRPC } from '@trpc/server'

export type Context = {
  auth: AuthObject
}

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
