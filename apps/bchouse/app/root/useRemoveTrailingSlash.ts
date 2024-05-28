import { useLocation, useNavigate } from '@remix-run/react'
import { useEffect } from 'react'

export function useRemoveTrailingSlash() {
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    // Remove trailing slash
    if (location.pathname !== '/' && location.pathname.slice(-1)[0] === '/') {
      navigate(
        `${location.pathname.slice(0, -1)}${location.search}${location.hash}`,
        { state: location.state, replace: true }
      )
    }
  }, [location])
}
