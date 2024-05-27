import { AuthObject } from '@clerk/clerk-sdk-node'
import { initTRPC } from '@trpc/server'
import superjson from 'superjson'

export type Context = {
  auth: AuthObject
}

/**
 * Initialization of tRPC backend
 * Should be done only once per backend!
 */
const t = initTRPC.context<Context>().create({
  transformer: superjson,
})

/**
 * Export reusable router and procedure helpers
 * that can be used throughout the router
 */
export const router = t.router
export const publicProcedure = t.procedure
export const mergeRouters = t.mergeRouters
export const createCallerFactory = t.createCallerFactory

import type { DehydratedState } from '@tanstack/react-query'
import { QueryClient, hydrate } from '@tanstack/react-query'
import {
  CreateTRPCReact,
  createTRPCQueryUtils,
  createTRPCReact,
} from '@trpc/react-query'
import type { inferRouterInputs, inferRouterOutputs } from '@trpc/server'
import { z } from 'zod'

export const appRouter = router({
  test: {
    a: publicProcedure
      .input(z.object({ s: z.string(), cursor: z.string().nullish() }))
      .query(() => {
        return false
      }),
    b: publicProcedure
      .input(z.object({ s: z.string(), cursor: z.string().nullish() }))
      .mutation((opts) => {
        if (opts.input.s === '') {
          throw new Error('')
        }

        return false
      }),
  },
})

export type AppRouter = typeof appRouter

export const trpc: CreateTRPCReact<AppRouter, any> =
  createTRPCReact<AppRouter>() as any

export type AppRouterOutputs = inferRouterOutputs<AppRouter>
export type AppRouterInputs = inferRouterInputs<AppRouter>

export const createTrpcClientUtils = (dehydratedState: DehydratedState) => {
  const queryClient = new QueryClient({})
  hydrate(queryClient, dehydratedState)
  const trpc = createTRPCReact() as any
  const trpcClientUtils = createTRPCQueryUtils<AppRouter>({
    queryClient,
    client: trpc,
    // transformer: superjson,
  })

  return trpcClientUtils
}
