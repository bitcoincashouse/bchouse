import * as React from 'react'

export function useThrottleCallback(
  callback: () => void | Promise<void>,
  interval = 500
) {
  const lastCalled = React.useRef<number | null>(null)
  const callbackRef = React.useRef(callback)
  callbackRef.current = callback

  return React.useCallback(() => {
    const now = Date.now()

    //On first call or throttle interval has passed, call the function
    if (!lastCalled.current || now >= lastCalled.current + interval) {
      lastCalled.current = now
      callbackRef.current()
    }
  }, [])
}
