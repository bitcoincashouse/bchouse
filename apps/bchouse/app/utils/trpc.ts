import type { AppRouter } from '@bchouse/api/src/index'
import { CreateTRPCReact, createTRPCReact } from '@trpc/react-query'
import type { inferRouterOutputs } from '@trpc/server'

export const trpc: CreateTRPCReact<AppRouter, any> =
  createTRPCReact<AppRouter>() as any

export type AppRouterOutputs = inferRouterOutputs<AppRouter>
