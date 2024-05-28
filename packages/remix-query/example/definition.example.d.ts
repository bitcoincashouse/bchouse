declare module 'remix-query' {
  import { LoaderFunctionArgs } from '@remix-run/node'
  import * as ReactQuery from '@tanstack/react-query'
  import {
    DefaultError,
    InfiniteQueryObserverOptions,
    MutationOptions,
    QueryClient,
    QueryObserverOptions,
    Updater,
    UseInfiniteQueryResult,
    UseMutationResult,
    UseQueryResult,
  } from '@tanstack/react-query'
  import { UseDataFunctionReturn } from 'remix-typedjson'

  type DistributiveOmit<T, K extends keyof any> = T extends any
    ? Omit<T, K>
    : never

  type URLSearchParamsInit =
    | string
    | string[][]
    | Record<string, string>
    | URLSearchParams
  // symbol won't be a key of SearchParams
  type IsSearchParams<T> = symbol extends keyof T ? false : true
  type ExportedQueryStrict<T> = IsSearchParams<T> extends true ? T : never
  type ExportedQueryUnstrict<T> = IsSearchParams<T> extends true
    ? T
    : URLSearchParamsInit
  type ExportedQuery<T> = ExportedQueryStrict<T>

  type HasLoader<T> = 'loader' extends keyof T ? true : false
  type ExportedLoader<T> = HasLoader<T> extends true ? T['loader'] : never
  type LoaderFunctionResult<T> = HasLoader<T> extends true
    ? UseDataFunctionReturn<T['loader']>
    : never

  type HasAction<T> = 'action' extends keyof T ? true : false
  type ExportedAction<T> = HasAction<T> extends true ? T['action'] : never
  type ActionFunctionResult<T> = HasAction<T> extends true
    ? UseDataFunctionReturn<T['action']>
    : never

  type HasHandler<T> = 'handle' extends keyof T ? true : false
  type ExportedHandle<T> = HasHandle<T> extends true ? T['handle'] : never

  type IsForm<T> = symbol extends keyof T ? false : true
  type ExportedForm<T> = IsForm<T> extends true ? T : void

  export interface Routes {
    '/': {
      params: {}
      query: ExportedQuery<import('./routes/root').SearchParams>
      loader: ExportedLoader<typeof import('./routes/root')>
      action: ExportedAction<typeof import('./routes/root')>
      handle: ExportedHandle<typeof import('./routes/root')>
      loaderResult: LoaderFunctionResult<typeof import('./routes/root')>
      actionResult: ActionFunctionResult<typeof import('./routes/root')>
      form: ExportedForm<import('./routes/root').FormSchema>
    }
  }

  type LoaderFunctionResult<T extends keyof RoutesWithLoader> =
    UseDataFunctionReturn<RoutesWithLoader[T]['loader']>

  export type QueryType = 'any' | 'infinite' | 'query'
  export type RemixQueryKey = [
    string[],
    { params?: unknown; type?: Exclude<QueryType, 'any'> }
  ]

  type RemixQueryClientUtils = {
    /**
     * @link https://tanstack.com/query/v5/docs/reference/QueryClient#queryclientfetchquery
     */
    fetch<
      Route extends keyof Routes,
      Params extends Routes[Route]['params'],
      Result extends Routes[Route]['loaderResult']
    >(
      route: Route,
      params: Params,
      opts?: DistributiveOmit<ReactQuery.FetchQueryOptions<Result>, 'queryKey'>
    ): Promise<Result>

    /**
     * @link https://tanstack.com/query/v5/docs/reference/QueryClient#queryclientfetchinfinitequery
     */
    fetchInfinite<
      Route extends keyof Routes,
      Params extends Routes[Route]['params'],
      Result extends Routes[Route]['loaderResult']
    >(
      route: Route,
      params: Params,
      opts?: DistributiveOmit<
        ReactQuery.FetchInfiniteQueryOptions<Params, Result>,
        'queryKey'
      >
    ): Promise<InfiniteData<Result, NonNullable<Cursor> | null>>

    /**
     * @link https://tanstack.com/query/v5/docs/reference/QueryClient#queryclientprefetchquery
     */
    prefetch<
      Route extends keyof RoutesWithLoader,
      Params extends RoutesWithLoader[Route]['params'],
      Result extends RoutesWithLoader[Route]['loaderResult']
    >(
      route: Route,
      params: Params,
      opts?: DistributiveOmit<ReactQuery.FetchQueryOptions<Params>, 'queryKey'>
    ): Promise<void>

    /**
     * @link https://tanstack.com/query/v5/docs/reference/QueryClient#queryclientprefetchinfinitequery
     */
    prefetchInfinite<
      Route extends keyof Routes,
      Params extends Routes[Route]['params'],
      Result extends Routes[Route]['loaderResult']
    >(
      route: Route,
      params: Params,
      opts?: DistributiveOmit<
        ReactQuery.FetchInfiniteQueryOptions<Params, Result>,
        'queryKey'
      >
    ): Promise<void>

    /**
     * @link https://tanstack.com/query/v5/docs/reference/QueryClient#queryclientensurequerydata
     */
    ensureData<
      Route extends keyof Routes,
      Params extends Routes[Route]['params'],
      Result extends Routes[Route]['loaderResult']
    >(
      route: Route,
      params: Params,
      opts?: DistributiveOmit<ReactQuery.FetchQueryOptions<Result>, 'queryKey'>
    ): Promise<Result>

    /**
     * @link https://tanstack.com/query/v5/docs/reference/QueryClient#queryclientinvalidatequeries
     */
    invalidate<
      Route extends keyof Routes,
      Params extends Routes[Route]['params'],
      Result extends Routes[Route]['loaderResult']
    >(
      route: Route,
      params?: Partial<Params>,
      filters?: DistributiveOmit<InvalidateQueryFilters, 'predicate'> & {
        predicate?: (
          query: Query<
            inferProcedureInput<TProcedure>,
            TRPCClientError<TRoot>,
            inferProcedureInput<TProcedure>,
            QueryKeyKnown<
              inferProcedureInput<TProcedure>,
              inferProcedureInput<TProcedure> extends { cursor?: any } | void
                ? 'infinite'
                : 'query'
            >
          >
        ) => boolean
      },
      options?: InvalidateOptions
    ): Promise<void>

    /**
     * @link https://tanstack.com/query/v5/docs/reference/QueryClient#queryclientrefetchqueries
     */
    refetch<
      Route extends keyof Routes,
      Params extends Routes[Route]['params'],
      Result extends Routes[Route]['loaderResult']
    >(
      route: Route,
      params?: Partial<Params>,
      filters?: RefetchQueryFilters,
      options?: RefetchOptions
    ): Promise<void>

    /**
     * @link https://tanstack.com/query/v5/docs/reference/QueryClient#queryclientcancelqueries
     */
    cancel<
      Route extends keyof Routes,
      Params extends Routes[Route]['params'],
      Result extends Routes[Route]['loaderResult']
    >(
      route: Route,
      params?: Partial<Params>,
      options?: CancelOptions
    ): Promise<void>

    /**
     * @link https://tanstack.com/query/v5/docs/reference/QueryClient#queryclientresetqueries
     */
    reset<
      Route extends keyof Routes,
      Params extends Routes[Route]['params'],
      Result extends Routes[Route]['loaderResult']
    >(
      route: Route,
      params?: Partial<Params>,
      options?: ResetOptions
    ): Promise<void>

    /**
     * @link https://tanstack.com/query/v5/docs/reference/QueryClient#queryclientsetquerydata
     */
    setData<
      Route extends keyof RoutesWithLoader,
      Params extends RoutesWithLoader[Route]['params'],
      Result extends RoutesWithLoader[Route]['loaderResult']
    >(
      /**
       * The input of the procedure
       */
      route: Route,
      params: Params,
      updater: Updater<Result | undefined, Result | undefined>,
      options?: SetDataOptions
    ): void

    /**
     * @link https://tanstack.com/query/v5/docs/reference/QueryClient#queryclientsetquerydata
     */
    setInfiniteData<
      Route extends keyof RoutesWithCursor,
      Params extends RoutesWithCursor[Route]['params'],
      Result extends RoutesWithCursor[Route]['loaderResult'],
      Cursor extends RoutesWithCursor[Route]['cursor']
    >(
      route: Route,
      params: Partial<Params>,
      updater: Updater<
        | ReactQuery.InfiniteData<Result, NonNullable<Result[]> | null>
        | undefined,
        ReactQuery.InfiniteData<Result, NonNullable<Cursor> | null> | undefined
      >,
      options?: SetDataOptions
    ): void

    /**
     * @link https://tanstack.com/query/v5/docs/reference/QueryClient#queryclientgetquerydata
     */
    getData<
      Route extends keyof RoutesWithLoader,
      Params extends RoutesWithLoader[Route]['params'],
      Result extends RoutesWithLoader[Route]['loaderResult']
    >(
      route: Route,
      params: Params
    ): Result | undefined

    /**
     * @link https://tanstack.com/query/v5/docs/reference/QueryClient#queryclientgetquerydata
     */
    getInfiniteData<
      Route extends keyof RoutesWithCursor,
      Params extends RoutesWithCursor[Route]['params'],
      Result extends RoutesWithCursor[Route]['loaderResult'],
      Cursor extends RoutesWithCursor[Route]['cursor']
    >(
      route: Route,
      params: Partial<Params>
    ): ReactQuery.InfiniteData<Result, NonNullable<Cursor> | null> | undefined
  }

  type RoutesWithParams = Pick<
    Routes,
    {
      [K in keyof Routes]: Routes[K]['params'] extends Record<string, never>
        ? never
        : K
    }[keyof Routes]
  >

  type RoutesWithAction = Pick<
    Routes,
    {
      [K in keyof Routes]: Routes[K]['action'] extends never ? never : K
    }[keyof Routes]
  >

  type RoutesWithLoader = Pick<
    Routes,
    {
      [K in keyof Routes]: Routes[K]['loader'] extends never ? never : K
    }[keyof Routes]
  >

  type RoutesWithCursor = Pick<
    Routes,
    {
      [K in keyof Routes]: Routes[K]['loader'] extends never
        ? never
        : 'cursor' extends keyof Routes[K]['params']
        ? K
        : never
    }[keyof Routes]
  >

  type RoutesWithHandle = Pick<
    Routes,
    {
      [K in keyof Routes]: Routes[K]['handle'] extends never ? never : K
    }[keyof Routes]
  >

  export type RouteId = 'root' | 'routes/index'

  type QueryOptions<QueryParams> = { queryParams?: QueryParams }
  type OptionsUnion<BaseOptions, Params, QueryParams> = Params extends Record<
    string,
    never
  >
    ? [opts?: BaseOptions & QueryOptions<QueryParams>]
    : [opts: BaseOptions & QueryOptions<QueryParams> & { params: Params }]

  type ActionOptionsUnion<BaseOptions, Params, QueryParams, Body> =
    Params extends Record<string, never>
      ? [opts?: BaseOptions & QueryOptions<QueryParams> & BodyOptions<Body>]
      : [
          opts: BaseOptions &
            QueryOptions<QueryParams> & {
              type?: 'json' | 'form'
              params: Params
            }
        ]

  export function $useActionMutation<
    Route extends keyof RoutesWithAction,
    Params extends RoutesWithAction[Route]['params'],
    QueryParams extends RoutesWithAction[Route]['query'],
    Result extends RoutesWithAction[Route]['actionResult'],
    Form extends RoutesWithAction[Route]['form'],
    RemixMutationOptions extends MutationOptions<Result, DefaultError, Form>
  >(
    route: Route,
    ...args: ActionOptionsUnion<
      Omit<RemixMutationOptions, 'mutationKey'>,
      Params,
      QueryParams,
      Form
    >
  ): UseMutationResult<Result, DefaultError, Form>

  export function createRemixClientUtils(
    opts:
      | {
          queryClient: QueryClient
        }
      | {
          dehydratedState: ReactQuery.DehydratedState
        }
  ): RemixQueryClientUtils

  export function getQueryKey<
    Route extends keyof RoutesWithLoader,
    Params extends RoutesWithLoader[Route]['params']
  >(route: Route, params?: Partial<Params>): RemixQueryKey

  export function $handle<
    Route extends keyof RoutesWithHandle,
    Rest extends {
      params: RoutesWithHandle[Route]['params']
      query?: RoutesWithHandle[Route]['query']
    },
    Result extends RoutesWithHandle[Route]['loaderResult'],
    QueryOptions extends QueryObserverOptions<Result>
  >(
    ...args: Rest['params'] extends Record<string, never>
      ? [
          route: Route,
          query?: Rest['query'],
          opts?: DistributiveOmit<QueryOptions, 'queryKey'>
        ]
      : [
          route: Route,
          params: Rest['params'],
          query?: Rest['query'],
          opts?: DistributiveOmit<QueryOptions, 'queryKey'>
        ]
  ): UseQueryResult<Result>

  export function $useLoaderInfiniteQuery<
    Route extends keyof RoutesWithCursor,
    Rest extends {
      params: RoutesWithCursor[Route]['params']
      query?: RoutesWithCursor[Route]['query']
    },
    Result extends RoutesWithCursor[Route]['loaderResult'],
    PageParam extends RoutesWithCursor[Route]['params']['cursor'],
    QueryOptions extends InfiniteQueryObserverOptions<
      Result,
      DefaultError,
      Result,
      Result,
      string,
      PageParam
    >
  >(
    route: Route,
    ...args: OptionsUnion<
      DistributiveOmit<QueryOptions, 'queryKey'>,
      Rest['params'],
      Rest['query']
    >
  ): UseInfiniteQueryResult<ReactQuery.InfiniteData<Result, PageParam>>

  export function $useLoaderQuery<
    Route extends keyof RoutesWithLoader,
    Rest extends {
      params: RoutesWithLoader[Route]['params']
      query?: RoutesWithLoader[Route]['query']
    },
    Result extends RoutesWithLoader[Route]['loaderResult'],
    QueryOptions extends QueryObserverOptions<Result>
  >(
    route: Route,
    ...args: OptionsUnion<
      DistributiveOmit<QueryOptions, 'queryKey'>,
      Rest['params'],
      Rest['query']
    >
  ): UseQueryResult<Result>

  export function $mutate<
    Route extends keyof RoutesWithAction,
    Params extends RoutesWithAction[Route]['params'],
    Body extends RoutesWithAction[Route]['form'],
    Result extends RoutesWithAction[Route]['actionResult']
  >(
    route: Route,
    opts: Params extends Record<string, never>
      ? { body: Body; type?: 'form' | 'json' }
      : { params: Params; body: Body; type?: 'form' | 'json' }
  ): Promise<Result>

  export function $params<
    Route extends keyof RoutesWithParams,
    Params extends RoutesWithParams[Route]['params']
  >(
    route: Route,
    params: { readonly [key: string]: string | undefined }
  ): { [K in keyof Params]: string }

  export function $path<
    Route extends keyof Routes,
    Rest extends {
      params: Routes[Route]['params']
      query?: Routes[Route]['query']
    }
  >(
    ...args: Rest['params'] extends Record<string, never>
      ? [route: Route, query?: Rest['query']]
      : [route: Route, params: Rest['params'], query?: Rest['query']]
  ): string

  export function $preload<
    Route extends keyof RoutesWithLoader,
    Rest extends {
      params: RoutesWithLoader[Route]['params']
      results: RoutesWithLoader[Route]['loaderResult']
    }
  >(
    args: LoaderFunctionArgs,
    route: Route,
    ...args: Rest['params'] extends Record<string, never>
      ? []
      : [params: Params]
  ): { dehydratedState: ReactQuery.DehydratedState }

  export function $preloadClient<
    Route extends keyof RoutesWithLoader,
    Params extends RoutesWithLoader[Route]['params'],
    Result extends RoutesWithLoader[Route]['loaderResult']
  >(
    route: Route,
    ...arags: Params extends Record<string, never> ? [] : [params: Params]
  ): { dehydratedState: Result }

  export function $routeId(routeId: RouteId): RouteId

  export function $useUtils(): RemixQueryClientUtils
}
