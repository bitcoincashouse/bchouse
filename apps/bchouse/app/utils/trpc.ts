import type { DehydratedState } from '@tanstack/react-query'
import { QueryClient, hydrate } from '@tanstack/react-query'
import {
  CreateTRPCReact,
  createTRPCQueryUtils,
  createTRPCReact,
} from '@trpc/react-query'
import type { inferRouterInputs, inferRouterOutputs } from '@trpc/server'
import superjson from 'superjson'
import type { AppRouter } from '~/.server/types/router'

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
    transformer: superjson,
  })

  return trpcClientUtils
}
