import { QueryClient } from '@tanstack/react-query'
import { useEffect, useRef } from 'react'
import {
  RemixQueryClientUtils,
  createRemixClientUtils,
  getQueryKey,
} from 'remix-query'

declare global {
  interface Window {
    remixQueryClientUtils: RemixQueryClientUtils
  }
}

export function useRemixQuery(queryClient: QueryClient) {
  const initRef = useRef(false)
  useEffect(() => {
    if (initRef.current === true) return
    initRef.current = true

    if (typeof window !== 'undefined') {
      window.remixQueryClientUtils = createRemixClientUtils({
        queryClient,
      })

      queryClient.setQueryDefaults(getQueryKey('/api/post/get/:postId'), {
        gcTime: Infinity,
      })

      queryClient.setQueryDefaults(
        getQueryKey('/api/post/feed/:type/:id/:cursor?'),
        {
          gcTime: Infinity,
        }
      )
    }
  })
}
