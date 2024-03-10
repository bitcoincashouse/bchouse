/// <reference types="vite/client" />
/// <reference types="@remix-run/node" />

import type { DataFunctionArgs } from '@remix-run/node'
import type { RouteMatch } from '@remix-run/react'
import { DehydratedState } from '@tanstack/react-query'
import { getServerClient } from '~/utils/trpc.server'

declare module '@remix-run/node' {
  export interface LoaderFunctionArgs extends DataFunctionArgs {
    context: {
      trpc: ReturnType<typeof getServerClient>
      getDehydratedState: () => { dehydratedState: DehydratedState }
    }
  }

  export interface ActionFunctionArgs extends DataFunctionArgs {
    context: {
      trpc: ReturnType<typeof getServerClient>
    }
  }
}

declare global {
  type PickValueType<T, U> = {
    [K in keyof T as T[K] extends U ? K : never]: T[K]
  }

  interface AppRouterContext {}
  interface AppRouteMatch extends Omit<RouteMatch, 'handle'> {
    handle: AppRouteHandle | undefined
  }

  interface AppRouteHandle {}

  interface RouteDescription {}
  type RouteHandler<T extends RouteId> = RouteDescription[T]['handle'] & {
    id: T
  }
  type RouteId = keyof RouteDescription
}
