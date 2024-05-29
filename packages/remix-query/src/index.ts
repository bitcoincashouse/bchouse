import { LoaderFunction, LoaderFunctionArgs } from '@remix-run/node'
import {
  CancelOptions,
  DefaultError,
  DehydratedState,
  FetchInfiniteQueryOptions,
  FetchQueryOptions,
  InfiniteData,
  InvalidateOptions,
  InvalidateQueryFilters,
  QueryClient,
  QueryFilters,
  RefetchOptions,
  RefetchQueryFilters,
  ResetOptions,
  SetDataOptions,
  Updater,
  UseInfiniteQueryOptions,
  UseMutationOptions,
  UseQueryOptions,
  dehydrate,
  hydrate,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import { useMemo } from 'react'

function includesParams(route: string) {
  return route.indexOf('/:') > -1 || route.indexOf('/*') > -1
}

type SearchParams =
  | string
  | string[][]
  | Record<string, string>
  | URLSearchParams
  | undefined
type Params = { readonly [key: string]: string | undefined }
type OptionsUnion<BaseOptions> = BaseOptions & {
  queryParams?: SearchParams
} & { params?: Params }
type Route = string
type Result = unknown
type Cursor = string | number
type DistributiveOmit<T, K extends keyof any> = T extends any
  ? Omit<T, K>
  : never
type RemixQueryKey = [string[], { readonly [key: string]: string | undefined }]

export function $path(route: string, ...paramsOrQuery: Array<any>) {
  let path = route
  let query: SearchParams = paramsOrQuery[0]

  if (includesParams(route)) {
    const params: any = paramsOrQuery[0] ?? {}
    query = paramsOrQuery[1]
    path = route
      .split('/')
      .map((fragment) => {
        if (fragment.indexOf('?') > -1) {
          fragment = fragment.slice(0, -1)
        }
        if (fragment.indexOf(':') > -1) {
          let [paramName, extension] = fragment.slice(1).split('.')
          if (paramName in params && params[paramName] !== undefined) {
            return params[paramName] + (extension ? '.' + extension : '')
          }
          return null
        }
        if (fragment == '*') {
          if ('*' in params) {
            return params['*']
          }
          return null
        }
        return fragment
      })
      .filter((f) => f !== null)
      .join('/')
  }

  if (!query) {
    return path
  }

  const searchParams = new URLSearchParams(query)

  return path + '?' + searchParams.toString()
}

export function $params(
  _route: string,
  params: { readonly [key: string]: string | undefined }
) {
  return params
}

export function $routeId(routeId: string) {
  return routeId
}

export function $useActionMutation(
  route: string,
  opts: OptionsUnion<
    DistributiveOmit<
      UseMutationOptions<unknown, unknown, unknown>,
      'mutationKey' | 'mutationFn'
    >
  > & {
    type?: 'json' | 'form'
  } = {}
) {
  const mutationKey = getQueryKey(route, opts.params || {})
  return useMutation({
    ...opts,
    mutationKey,
    mutationFn: async (variables: Record<string, unknown>) => {
      const { body, type } = getBody({
        body: variables,
        type: opts.type,
      })

      const path = $path(route, opts.params)
      const result = await fetch(path, {
        method: 'POST',
        body,
        headers: {
          'Content-Type': type,
        },
      })

      //TODO: Add superjson serializer?
      const resultJson = await result.json()
      return resultJson
    },
  })
}

function getQueryKeyInternal(
  route: string,
  params: { readonly [key: string]: string | undefined } = {}
): RemixQueryKey {
  const pathParts = route.split('/')
  return [pathParts, params]
}

export function getQueryKey(
  route: string,
  params: { readonly [key: string]: string | undefined }
) {
  return getQueryKeyInternal(route, params)
}

export function $useLoaderQuery(
  route: string,
  opts?: OptionsUnion<DistributiveOmit<UseQueryOptions, 'queryKey'>>
) {
  return useQuery({
    queryKey: getQueryKeyInternal(route, opts?.params),
    queryFn: async () => {
      const path = $path(route, opts?.params)
      const result = await fetch(path)
      //TODO: Add superjson serializer?
      return result.json()
    },
    ...opts,
  })
}

export function $handle(
  route: string,
  params: { readonly [key: string]: string | undefined }
) {
  const queryKey = getQueryKey(route, params)
  return params
}

export async function $preload(
  args: LoaderFunctionArgs,
  route: string,
  params: { readonly [key: string]: string | undefined } = {}
) {
  //TODO: Get type to preload query or infiniteQuery
  if (!args) {
    throw new Error(
      'Invalid arguments to preload function. LoaderFunctionArgs required'
    )
  }

  const queryKey = getQueryKey(route, params)
  const queryClient = new QueryClient()
  await queryClient.fetchQuery({
    queryKey,
    queryFn: async () => {
      //@ts-ignore
      const { routes } = await import('virtual:remix-query/runtime')
      const routeImpl = routes[route]
      if (!routeImpl) {
        throw new Error('Route not found for route id: ' + route)
      }

      const { loader } = (await routeImpl()) as { loader: LoaderFunction }

      if (!loader) {
        throw new Error('Loader not found for route id: ' + route)
      }

      const result = await loader({
        ...args,
        params,
      })

      if (result instanceof Error) {
        throw result
      } else if (result instanceof Response) {
        const isJson = result.headers
          .get('Content-Type')
          ?.includes('application/json')

        if (isJson && result.body !== null) {
          return await result.json()
        } else if (!isJson) {
          return await result.text()
        } else {
          return null
        }
      } else {
        return result
      }
    },
  })

  const dehydratedState = dehydrate(queryClient)
  console.log({ dehydratedState })
  return { dehydratedState }
}

function getBody(opts?: {
  body?: Record<string, unknown>
  type?: 'json' | 'form'
}) {
  if (!opts?.type || opts.type === 'form') {
    const formData = new URLSearchParams()
    const body = opts?.body || {}
    for (var key in body) {
      formData.append(key, body[key] as string)
    }

    return {
      body: formData.toString(),
      type: 'application/x-www-form-urlencoded',
    }
  } else {
    return {
      body: opts?.body ? JSON.stringify(opts.body) : undefined,
      type: 'application/json',
    }
  }
}

export async function $mutate(
  route: string,
  opts: {
    params: { readonly [key: string]: string | undefined }
    body: Record<string, unknown>
    type: 'json' | 'form'
  }
) {
  const path = $path(route, opts.params || {})
  const { body, type } = getBody(opts)

  const result = await fetch(path, {
    method: 'POST',
    body,
    headers: {
      'Content-Type': type,
    },
  })
  return result.json()
}

export function $useLoaderInfiniteQuery(
  route: string,
  opts: OptionsUnion<DistributiveOmit<UseInfiniteQueryOptions, 'queryKey'>>
) {
  const queryKey = getQueryKey(route, opts?.params || {})
  return useInfiniteQuery({
    ...opts,
    queryKey,
    queryFn: async () => {
      const path = $path(route, opts?.params)
      const result = await fetch(path)
      return result.json()
    },
  })
}

function createClientUtils(queryClient: QueryClient) {
  return {
    fetch(
      route: string,
      params: Params,
      opts?: Omit<FetchQueryOptions<Result>, 'queryKey' | 'queryFn'>
    ) {
      const queryKey = getQueryKey(route, params)
      return queryClient.fetchQuery({
        ...opts,
        queryKey,
        queryFn: async () => {
          console.log('Fetching: ', queryKey)
        },
      })
    },

    fetchInfinite(
      route: Route,
      params: Params,
      opts?: DistributiveOmit<
        FetchInfiniteQueryOptions<
          Result,
          DefaultError,
          Result,
          RemixQueryKey,
          unknown
        >,
        'queryKey' | 'initialPageParam'
      > & { initialCursor: unknown }
    ) {
      const queryKey = getQueryKey(route, params)
      return queryClient.fetchInfiniteQuery({
        ...opts,
        queryKey,
        queryFn: async () => {
          console.log('Fetching: ', queryKey)
          return
        },
        initialPageParam: opts?.initialCursor ?? null,
      })
    },

    prefetch(
      route: Route,
      params: Params,
      opts?: DistributiveOmit<FetchQueryOptions<Result>, 'queryKey'>
    ) {
      const queryKey = getQueryKey(route, params)
      return queryClient.prefetchQuery({
        ...opts,
        queryKey,
        queryFn: async () => {
          console.log('Fetching: ', queryKey)
          return
        },
      })
    },

    prefetchInfinite(
      route: Route,
      params: Params,
      opts?: DistributiveOmit<
        FetchInfiniteQueryOptions<
          Result,
          DefaultError,
          Result,
          RemixQueryKey,
          unknown
        >,
        'queryKey' | 'initialPageParam'
      > & { initialCursor: unknown }
    ) {
      const queryKey = getQueryKey(route, params)
      return queryClient.prefetchInfiniteQuery({
        ...opts,
        queryKey,
        queryFn: async () => {
          console.log('Fetching: ', queryKey)
          return
        },
        initialPageParam: opts?.initialCursor ?? null,
      })
    },

    ensureData(
      route: Route,
      params: Params,
      opts?: DistributiveOmit<FetchQueryOptions<Result>, 'queryKey'>
    ) {
      const queryKey = getQueryKey(route, params)
      return queryClient.ensureQueryData({
        ...opts,
        queryKey,
        queryFn: async () => {
          console.log('Fetching: ', queryKey)
          return
        },
      })
    },

    invalidate(
      route: Route,
      params?: Partial<Params>,
      filters?: InvalidateQueryFilters,
      options?: InvalidateOptions
    ) {
      const queryKey = getQueryKey(route, params || {})
      return queryClient.invalidateQueries(
        {
          ...filters,
          queryKey,
        },
        options
      )
    },

    refetch(
      route: Route,
      params?: Partial<Params>,
      filters?: RefetchQueryFilters,
      options?: RefetchOptions
    ) {
      const queryKey = getQueryKey(route, params || {})
      return queryClient.refetchQueries(
        {
          ...filters,
          queryKey,
        },
        options
      )
    },

    cancel(
      route: Route,
      params?: Partial<Params>,
      filters?: QueryFilters,
      options?: CancelOptions
    ) {
      const queryKey = getQueryKey(route, params || {})
      return queryClient.cancelQueries(
        {
          ...filters,
          queryKey,
        },
        options
      )
    },

    reset(
      route: Route,
      params?: Partial<Params>,
      filters?: QueryFilters,
      options?: ResetOptions
    ) {
      const queryKey = getQueryKey(route, params || {})
      return queryClient.resetQueries(
        {
          ...filters,
          queryKey,
        },
        options
      )
    },

    setData(
      route: Route,
      params: Params,
      updater: Updater<Result | undefined, Result | undefined>,
      options?: SetDataOptions
    ) {
      const queryKey = getQueryKey(route, params)
      return queryClient.setQueryData(queryKey, updater, options)
    },

    getData(route: Route, params: Params) {
      const queryKey = getQueryKey(route, params)
      return queryClient.getQueryData(queryKey)
    },

    setInfiniteData(
      route: Route,
      params: Partial<Params>,
      updater: Updater<
        InfiniteData<Result, NonNullable<Result[]> | null> | undefined,
        InfiniteData<Result, NonNullable<Cursor> | null> | undefined
      >,
      options?: SetDataOptions
    ) {
      const queryKey = getQueryKey(route, params)
      return queryClient.setQueryData(queryKey, updater, options)
    },

    getInfiniteData(route: Route, params: Partial<Params>) {
      const queryKey = getQueryKey(route, params)
      return queryClient.getQueryData(queryKey)
    },
  }
}

export function $useUtils(): ReturnType<typeof createClientUtils> {
  const queryClient = useQueryClient()
  return useMemo(() => createClientUtils(queryClient), [queryClient])
}

export function createRemixClientUtils(
  opts:
    | {
        queryClient: QueryClient
      }
    | {
        dehydratedState: DehydratedState
      }
): ReturnType<typeof createClientUtils> {
  if ('queryClient' in opts) {
    return createClientUtils(opts.queryClient)
  } else {
    const queryClient = new QueryClient({})
    hydrate(queryClient, opts.dehydratedState)
    return createClientUtils(queryClient)
  }
}
