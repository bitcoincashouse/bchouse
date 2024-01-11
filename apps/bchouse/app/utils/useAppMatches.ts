import { useMatches as useRemixMatches } from '@remix-run/react'

export function useMatches() {
  return useRemixMatches() as AppRouteMatch[]
}

export const useAppMatches = useMatches
