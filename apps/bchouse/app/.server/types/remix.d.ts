import type { DataFunctionArgs } from '@remix-run/node'
import type { RouteMatch } from '@remix-run/react'
import type { Context } from '../getContext'

declare module '@remix-run/node' {
  export interface LoaderFunctionArgs extends DataFunctionArgs {
    context: Context
  }

  export interface ActionFunctionArgs extends DataFunctionArgs {
    context: Context
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
  type RouteIdsWithData = Pick<
    RouteDescription,
    {
      [K in keyof RouteDescription]: 'data' extends keyof RouteDescription[K]
        ? K
        : never
    }[keyof RouteDescription]
  >
}
