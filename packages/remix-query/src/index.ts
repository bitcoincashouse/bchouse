import { useQuery, UseQueryOptions } from '@tanstack/react-query'

function includesParams(route: string) {
  return route.indexOf('/:') > -1 || route.indexOf('/*') > -1
}

export function $path(route: string, ...paramsOrQuery: Array<any>) {
  let path = route
  let query:
    | string
    | string[][]
    | Record<string, string>
    | URLSearchParams
    | undefined = paramsOrQuery[0]

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

export function $action(
  _route: string,
  params: { readonly [key: string]: string | undefined }
) {
  return params
}

function getQueryKeyInternal(
  _route: string,
  params: { readonly [key: string]: string | undefined }
) {
  const pathParts = _route.split('/')
  return [pathParts, params]
}

export function getQueryKey(
  _route: string,
  params: { readonly [key: string]: string | undefined }
) {
  return getQueryKeyInternal(_route, params)
}

export function $loader(
  _route: string,
  params: { readonly [key: string]: string | undefined },
  opts: Omit<UseQueryOptions, 'queryKey'>
) {
  return useQuery({
    queryKey: getQueryKeyInternal(_route, params),
    queryFn: async () => {
      const path = $path(_route, params)
      const result = await fetch(path)
      //TODO: Add superjson serializer?
      return result.json()
    },
    ...opts,
  })
}

export function $handle(
  _route: string,
  params: { readonly [key: string]: string | undefined }
) {
  return params
}
