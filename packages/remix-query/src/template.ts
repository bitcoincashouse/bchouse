export const template = `declare module "remix-query" {
  import { QueryObserverOptions, UseQueryResult } from "@tanstack/react-query"
  import { UseDataFunctionReturn } from "remix-typedjson";

  type URLSearchParamsInit = string | string[][] | Record<string, string> | URLSearchParams;
  // symbol won't be a key of SearchParams
  type IsSearchParams<T> = symbol extends keyof T ? false : true;
  <% if (strictMode) { %>
    type ExportedQuery<T> = IsSearchParams<T> extends true ? T : never;
  <% } else { %>
    type ExportedQuery<T> = IsSearchParams<T> extends true ? T : URLSearchParamsInit;
  <% } %>

  type HasLoader<T> = 'loader' extends keyof T ? true : false;
  type ExportedLoader<T> = HasLoader<T> extends true ? 
    T['loader'] : 
    never;
  type LoaderFunctionResult<T> = HasLoader<T> extends true ? 
    UseDataFunctionReturn<T["loader"]> : 
    never;

  type HasAction<T> = 'action' extends keyof T ? true : false;
  type ExportedAction<T> = HasAction<T> extends true ? T['action'] : never;
  type ActionFunctionResult<T> = HasAction<T> extends true ? 
    UseDataFunctionReturn<T["action"]> : 
    never;

  type HasHandler<T> = 'handle' extends keyof T ? true : false;
  type ExportedHandle<T> = HasHandle<T> extends true ? T['handle'] : never;


  export interface Routes {
  <% routes.forEach(({ route, params, fileName }) => { %>
    "<%- route %>": {
      params: {
      <% params.forEach(param => { %>
        <%- param %>: string | number;
      <% }) %>
      },
      query: ExportedQuery<import('<%- relativeAppDirPath %>/<%- fileName %>').SearchParams>,
      loader: ExportedLoader<typeof import('<%- relativeAppDirPath %>/<%- fileName %>')>,
      action: ExportedAction<typeof import('<%- relativeAppDirPath %>/<%- fileName %>')>,
      handle: ExportedHandle<typeof import('<%- relativeAppDirPath %>/<%- fileName %>')>,
      loaderResult: LoaderFunctionResult<typeof import('<%- relativeAppDirPath %>/<%- fileName %>')>
    };
  <% }) %>
  }

  type RoutesWithParams = Pick<
    Routes,
    {
      [K in keyof Routes]: Routes[K]["params"] extends Record<string, never> ? never : K
    }[keyof Routes]
  >;

  type RoutesWithAction = Pick<
    Routes,
    {
      [K in keyof Routes]: Routes[K]["action"] extends never ? never : K
    }[keyof Routes]
  >;

  type RoutesWithLoader = Pick<
    Routes,
    {
      [K in keyof Routes]: Routes[K]["loader"] extends never ? never : K
    }[keyof Routes]
  >;

  type RoutesWithHandle = Pick<
    Routes,
    {
      [K in keyof Routes]: Routes[K]["handle"] extends never ? never : K
    }[keyof Routes]
  >;

  export type RouteId =<% routeIds.forEach((routeId) => { %>
    | '<%- routeId %>'<% }) %>;

  export function $path<
    Route extends keyof Routes,
    Rest extends {
      params: Routes[Route]["params"];
      query?: Routes[Route]["query"];
    }
  >(
    ...args: Rest["params"] extends Record<string, never>
      ? [route: Route, query?: Rest["query"]]
      : [route: Route, params: Rest["params"], query?: Rest["query"]]
  ): string;

  export function $params<
    Route extends keyof RoutesWithParams,
    Params extends RoutesWithParams[Route]["params"]
  >(
      route: Route,
      params: { readonly [key: string]: string | undefined }
  ): {[K in keyof Params]: string};

  export function $routeId(routeId: RouteId): RouteId;

  export function $action<
    Route extends keyof RoutesWithAction,
    Rest extends {
      params: RoutesWithAction[Route]["params"];
      query?: RoutesWithAction[Route]["query"];
    },
    Result extends RoutesWithAction[Route]["loaderResult"],
    QueryOptions extends QueryObserverOptions<Result>
  >(
    ...args: Rest["params"] extends Record<string, never>
    ? [route: Route, query?: Rest["query"], opts?: Omit<QueryOptions, 'queryKey'>]
    : [route: Route, params: Rest["params"], query?: Rest["query"], opts?: Omit<QueryOptions, 'queryKey'>]
  ): UseQueryResult<Result>;

  type LoaderFunctionResult<T extends keyof RoutesWithLoader> = UseDataFunctionReturn<RoutesWithLoader[T]["loader"]>;

  export function $loader<
    Route extends keyof RoutesWithLoader,
    Rest extends {
      params: RoutesWithLoader[Route]["params"];
      query?: RoutesWithLoader[Route]["query"];
    },
    Result extends RoutesWithLoader[Route]["loaderResult"],
    QueryOptions extends QueryObserverOptions<Result>
  >(
    ...args: Rest["params"] extends Record<string, never>
    ? [route: Route, query?: Rest["query"], opts?: Omit<QueryOptions, 'queryKey'>]
    : [route: Route, params: Rest["params"], query?: Rest["query"], opts?: Omit<QueryOptions, 'queryKey'>]
  ): UseQueryResult<Result>;

  export function $handle<
    Route extends keyof RoutesWithHandle,
    Rest extends {
      params: RoutesWithHandle[Route]["params"];
      query?: RoutesWithHandle[Route]["query"];
    },
    Result extends RoutesWithHandle[Route]["loaderResult"],
    QueryOptions extends QueryObserverOptions<Result>
  >(
    ...args: Rest["params"] extends Record<string, never>
    ? [route: Route, query?: Rest["query"], opts?: Omit<QueryOptions, 'queryKey'>]
    : [route: Route, params: Rest["params"], query?: Rest["query"], opts?: Omit<QueryOptions, 'queryKey'>]
  ): UseQueryResult<Result>;
}`
