import { useEffect, useRef } from 'react'

export function useMounted(
  effect: React.EffectCallback,
  deps?: React.DependencyList | undefined
) {
  const mountRef = useRef(false)
  const callbackRef = useRef<React.EffectCallback>(effect)
  callbackRef.current = effect

  useEffect(() => {
    if (!mountRef.current) {
      mountRef.current = true
      return
    }

    callbackRef.current()
  }, deps)
}
