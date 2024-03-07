import React from 'react'
import { trpc } from '~/utils/trpc'
import { useThrottleCallback } from '~/utils/useThrottle'

export function useUpdateLastActive(isEnabled: boolean) {
  const isEnabledRef = React.useRef<boolean>(isEnabled)
  const isVisibleRef = React.useRef<boolean>(true)

  isEnabledRef.current = isEnabled

  const updateActivityMutation = trpc.profile.updateLastActive.useMutation()

  const updateLastActiveCallback = useThrottleCallback(() => {
    if (isEnabledRef.current && isVisibleRef.current) {
      updateActivityMutation.mutate()
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
