import { useEffect, useRef } from "react";

/**
 * Routinely call a function at some interval and clean up when it returns false.
 */
export function useInterval(callback: any, delay: any) {
  const savedCallback = useRef<() => boolean>();

  useEffect(() => {
    savedCallback.current = callback;
  });

  useEffect(() => {

    function tick() {
      savedCallback.current?.();
    }

    if (delay !== null) {
      let id = setInterval(tick, delay);
      return () => clearInterval(id);
    }
    
    return;
  }, [delay]);
}