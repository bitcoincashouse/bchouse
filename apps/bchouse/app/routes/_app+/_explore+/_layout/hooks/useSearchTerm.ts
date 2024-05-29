import { useNavigation, useSearchParams } from '@remix-run/react'
import { AnyFunction, isFunction, isString } from 'is-what'
import { useMemo } from 'react'
import { useFindMatchHandle } from '~/utils/appHooks'

function isStringOrMatchFunction(val: unknown): val is string | AnyFunction {
  return isString(val) || isFunction(val)
}

export function useSearchTerm() {
  const result = useFindMatchHandle('query', isStringOrMatchFunction)
  const [searchParams] = useSearchParams()

  const navigation = useNavigation()
  const defaultQuery =
    new URLSearchParams(navigation.location?.search).get('q') ||
    searchParams.get('q') ||
    undefined

  const queryOrFn = result?.handle?.query
  const query = useMemo(() => {
    if (!queryOrFn) return undefined
    if (isString(queryOrFn)) return queryOrFn

    try {
      const query = queryOrFn(result)
      return isString(query) ? query : undefined
    } catch (err) {
      return undefined
    }
  }, [queryOrFn])

  return query || defaultQuery
}
