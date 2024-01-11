import React from 'react'

export const useBrowserLayoutEffect =
  typeof window !== 'undefined' ? React.useLayoutEffect : React.useEffect
