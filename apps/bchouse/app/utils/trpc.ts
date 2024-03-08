import type { AppRouter } from '@bchouse/api/src/index'
import type { DehydratedState } from '@tanstack/react-query'
import { QueryClient, hydrate } from '@tanstack/react-query'
import {
  CreateTRPCReact,
  createTRPCQueryUtils,
  createTRPCReact,
} from '@trpc/react-query'
import type { inferRouterOutputs } from '@trpc/server'

export const trpc: CreateTRPCReact<AppRouter, any> =
  createTRPCReact<AppRouter>() as any

export type AppRouterOutputs = inferRouterOutputs<AppRouter>

export const createTrpcClientUtils = (dehydratedState: DehydratedState) => {
  const queryClient = new QueryClient({})
  hydrate(queryClient, dehydratedState)
  return createTRPCQueryUtils<AppRouter>({
    queryClient,
    client: createTRPCReact() as any,
  })
}
