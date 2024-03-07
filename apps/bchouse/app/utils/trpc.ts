import type { AppRouter } from '@bchouse/api/src/index'
import { CreateTRPCReact, createTRPCReact } from '@trpc/react-query'
import type { inferRouterOutputs } from '@trpc/server'
export type { inferAppRouterOutput }

export const trpc: CreateTRPCReact<AppRouter, any> =
  createTRPCReact<AppRouter>() as any

type AppRouterOutputs = inferRouterOutputs<AppRouter>
type inferAppRouterOutput<T extends keyof AppRouterOutputs> =
  AppRouterOutputs[T]
