import { UseDataFunctionReturn, useTypedLoaderData } from 'remix-typedjson'

export function useSafeTypedLoaderData<T>() {
  const data = useTypedLoaderData<T | { ok: false; err: unknown }>()
  if (data && typeof data === 'object' && 'ok' in data && !data.ok) {
    //TODO: Handle error in data
    return null
  }

  return data as UseDataFunctionReturn<T>
}
