import { QueryClient } from '@tanstack/react-query'
import { useState } from 'react'

declare global {
  interface Window {
    queryClient: QueryClient
  }
}

export function useQueryClient() {
  const [queryClient] = useState(() => {
    const queryClient = new QueryClient()
    if (typeof window !== 'undefined') {
      window.queryClient = queryClient
    }

    return queryClient
  })

  return queryClient
}
