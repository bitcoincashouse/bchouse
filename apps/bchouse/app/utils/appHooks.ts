import { UIMatch, useMatches } from '@remix-run/react'
import { hasHandle } from '~/utils/handle'
//@ts-ignore
import { isString } from 'is-what'
import { useMemo } from 'react'
import { UseDataFunctionReturn } from 'remix-typedjson'
import { useAppMatches } from '~/utils/useAppMatches'

export function createHandle<T extends RouteId, E>(id: T, obj: E) {
  return {
    id,
    ...obj,
  }
}

export function useAppRouteMatch<T extends RouteId>({ id }: { id: T }) {
  const matches = useMatches()
  return matches
    .filter(hasHandle('id', isString))
    .find((match) => match.handle.id === id) as any as RouteDescription[T]
}

export function useAppLoaderData<T extends keyof RouteIdsWithData>({
  id,
}: {
  id: T
}) {
  const matches = useMatches()
  return matches
    .filter(hasHandle('id', isString))
    .find((match) => match.handle.id === id)?.data as UseDataFunctionReturn<
    RouteIdsWithData[T]['data']
  >
}

declare global {
  interface AppRouteHandle {
    showFooter?: boolean
    showFullscreen?: boolean
    showHeader?: boolean
    title?: string
    containerClassName?: string
  }
}

export function usePageDisplay() {
  const matches = useAppMatches()

  return useMemo(() => {
    const showFullScreen = matches.some((match) => match.handle?.showFullscreen)
    const showHeader = matches.some((match) => match.handle?.showHeader)
    const showFooter = matches.some((match) => match.handle?.showFooter)
    const title = matches
      .map((match) => match.handle?.title)
      .filter(Boolean)
      .pop()
    const containerClassName = Array.from(matches)
      .reverse()
      .find((match) => !!match.handle?.containerClassName)
      ?.handle?.containerClassName

    return {
      fullscreen: showFullScreen,
      header: showHeader,
      title,
      showFooter,
      containerClassName,
    }
  }, [matches])
}

export function useFindMatchHandle<Handle extends string, Value>(
  handleName: Handle,
  typePredicate: (v: unknown) => v is Value
) {
  const matches = useMatches()

  return useMemo(
    () =>
      matches.find((match, i) => {
        return hasHandle(handleName, typePredicate)(match)
      }) as UIMatch<unknown, Record<Handle, Value>> | undefined,
    [matches]
  )
}
