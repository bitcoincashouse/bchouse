import {
  Links,
  Location,
  Meta,
  Scripts,
  useBeforeUnload,
  useLocation,
  useNavigation,
} from '@remix-run/react'
import React, { useEffect, useRef } from 'react'
import { useLocalStorage } from 'usehooks-ts'
import {
  ClientThemeHydrationScript,
  useClientTheme,
  useTheme,
  withThemeProvider,
} from './components/theme-provider'
import { classnames } from './components/utils/classnames'
import { useAppMatches } from './utils/useAppMatches'
import { useBrowserLayoutEffect } from './utils/useBrowserLayoutEffect'

export const Document = withThemeProvider<
  React.PropsWithChildren & { className?: string }
>(({ className, children, specifiedTheme }) => {
  const [theme] = useTheme()
  const [clientTheme] = useClientTheme()
  const location = useLocation()

  return (
    <html
      lang="en"
      className={classnames(
        'bg-primary text-primary-text',
        location.pathname === '/' ? null : theme
      )}
    >
      <head>
        <ClientThemeHydrationScript ssrTheme={Boolean(specifiedTheme)} />
        <Meta />
        <Links />
      </head>
      <body
        className={classnames(
          location.pathname === '/' ? null : clientTheme,
          className
        )}
      >
        <div id="app">
          <div className="w-full flex flex-col min-h-screen">{children}</div>
        </div>
        <ScrollRestoration
          getKey={(location, matches) => {
            if (
              matches.some((match) => match.handle?.preventScrollRestoration)
            ) {
              return null
            }

            return location.key
          }}
        />
        <Scripts />
      </body>
    </html>
  )
})

const useScrollPositionStorage = () => {
  const STORAGE_KEY = 'scrollRestorePositions'
  const [storage, setStorage] = useLocalStorage(
    STORAGE_KEY,
    {} as Record<any, number>
  )

  return [storage, setStorage] as const
}

export const useSavedScroll = () => {
  const [storage] = useScrollPositionStorage()
  const location = useLocation()
  return storage[location.key]
}

type RouteState = {
  location: Location
  matches: AppRouteMatch[]
}

type BasicRouteHandler<T> =
  | ((
      previousRouteState: RouteState | null,
      currentRouteState: RouteState,
      currentMatch: AppRouteMatch
    ) => T | undefined | null)
  | T
  | undefined
  | null

declare global {
  interface AppRouteHandle {
    skipScrollRestoration?: BasicRouteHandler<boolean>
    preventScrollRestoration?: BasicRouteHandler<boolean>
    preventScrollReset?: BasicRouteHandler<boolean>
  }
}

function getHandlePredicate<
  T extends keyof PickValueType<AppRouteHandle, BasicRouteHandler<boolean>>
>(
  {
    currentState,
    previousState,
  }: { currentState: RouteState; previousState: RouteState | null },
  handlerName: T
) {
  return currentState.matches.some((match) => {
    const handler = match.handle?.[handlerName]
    return typeof handler === 'function'
      ? handler(previousState, currentState, match)
      : handler
  })
}

function ScrollRestoration({
  getKey,
}: {
  getKey: (
    location: Location,
    matches: AppRouteMatch[]
  ) => string | undefined | null
}) {
  const matches = useAppMatches()
  const location = useLocation()
  const [storage, setStorage] = useScrollPositionStorage()

  const stateRef = useRef<{
    currentState: RouteState
    previousState: RouteState | null
    storage: Record<any, number>
  }>({
    currentState: {
      matches,
      location,
    },
    previousState: null,
    storage,
  })

  const navigation = useNavigation()

  React.useEffect(() => {
    window.history.scrollRestoration = 'manual'
    return () => {
      window.history.scrollRestoration = 'auto'
    }
  }, [])

  useBrowserLayoutEffect(() => {
    stateRef.current = {
      currentState: {
        location,
        matches,
      },
      previousState: {
        location: stateRef.current.currentState.location,
        matches: stateRef.current.currentState.matches,
      },
      storage,
    }

    const userKey = getKey(location, matches)
    const key = typeof userKey === 'undefined' ? location.key : userKey
    const scrollPosition = key !== null && stateRef.current.storage[key]
    const skipRestore = getHandlePredicate(
      stateRef.current,
      'skipScrollRestoration'
    )

    if (key !== null && typeof scrollPosition === 'number' && !skipRestore) {
      window.scrollTo(0, scrollPosition)
      return
    }

    const skipReset = getHandlePredicate(stateRef.current, 'preventScrollReset')

    if (!skipReset) {
      window.scrollTo(0, 0)
    }
  }, [location.key])

  useEffect(() => {
    //Save current scroll position when navigating via browser back/forward
    function onPopState() {
      const {
        currentState: { location, matches },
        storage,
      } = stateRef.current
      stateRef.current = {
        ...stateRef.current,
        previousState: { location, matches },
      }
      const userKey = getKey(location, matches)

      if (userKey !== null) {
        const key = typeof userKey === 'undefined' ? location.key : userKey
        setStorage({ ...storage, [key]: window.scrollY })
      }
    }

    window.addEventListener('popstate', onPopState)

    return () => {
      window.removeEventListener('popstate', onPopState)
    }
  }, [])

  useBeforeUnload(() => {
    //Save current scroll position when navigating away
    const {
      currentState: { location, matches },
      storage,
    } = stateRef.current
    stateRef.current = {
      ...stateRef.current,
      previousState: { location, matches },
    }
    const userKey = getKey(location, matches)

    if (userKey !== null) {
      const key = typeof userKey === 'undefined' ? location.key : userKey
      setStorage({ ...storage, [key]: window.scrollY })
    }
  })

  useEffect(() => {
    //Save current scroll position when navigating away
    if (navigation?.location?.key) {
      const {
        currentState: { location, matches },
        storage,
      } = stateRef.current
      stateRef.current = {
        ...stateRef.current,
        previousState: { location, matches },
      }
      const userKey = getKey(location, matches)

      if (userKey !== null) {
        const key = typeof userKey === 'undefined' ? location.key : userKey
        setStorage({ ...storage, [key]: window.scrollY })
      }
    }
  }, [navigation.location?.key])

  return <></>
}
