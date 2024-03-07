import type { AppRouter } from '@bchouse/api/src/index'
import { CreateTRPCReact, createTRPCReact } from '@trpc/react-query'

export const trpc: CreateTRPCReact<AppRouter, any> =
  createTRPCReact<AppRouter>() as any
