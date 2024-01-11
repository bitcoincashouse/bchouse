import { useSearchParams } from '@remix-run/react'
import { useCallback } from 'react'

export function useCloseCreatePostModal() {
  const [searchParams, setSearchParams] = useSearchParams()

  const closeModal = useCallback(() => {
    const newParams = new URLSearchParams(searchParams)
    newParams.delete('postId')
    newParams.delete('modal')
    setSearchParams(newParams, { replace: true, preventScrollReset: true })
    return false
  }, [])

  return closeModal
}
