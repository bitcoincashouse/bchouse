import type { ActionArgs } from '@remix-run/node'
import React from 'react'
import { $path } from 'remix-routes'
import { useTypedFetcher } from 'remix-typedjson'
import { logger } from '~/utils/logger'
import { useThrottleCallback } from '~/utils/useThrottle'

export const action = async (_: ActionArgs) => {
  try {
    const { userId } = await _.context.authService.getAuthOptional(_)

    if (userId) {
      await _.context.userService.updateAccountActivity(userId)
    }

    return null
  } catch (err) {
    logger.error(err)
    throw err
  }
}

export function useUpdateLastActive(isEnabled: boolean) {
  const fetcher = useTypedFetcher<typeof action>()
  const isEnabledRef = React.useRef<boolean>(isEnabled)
  const isVisibleRef = React.useRef<boolean>(true)

  isEnabledRef.current = isEnabled

  const updateLastActiveCallback = useThrottleCallback(() => {
    if (isEnabledRef.current && isVisibleRef.current) {
      fetcher.submit({
        action: $path('/api/update-last-active'),
        method: 'POST',
        encType: 'application/json',
      })
    }
  }, 60 * 60 * 1000)

  React.useEffect(() => {
    const handleVisibilityChange = () => {
      isVisibleRef.current = document.visibilityState === 'visible'
      updateLastActiveCallback()
    }

    document.addEventListener('visibilitychange', handleVisibilityChange, {
      passive: true,
    })

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  React.useEffect(() => {
    let interval: NodeJS.Timeout

    //Run immediately on mount
    updateLastActiveCallback()

    //Run every 15 minutes (shorter than throttle) in case the user stays active for long sessions without switch tabs
    interval = setInterval(() => {
      updateLastActiveCallback()
    }, 15 * 60 * 1000)

    return () => clearInterval(interval)
  }, [])
}
