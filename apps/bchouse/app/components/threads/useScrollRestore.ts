import { useLocation, useNavigation } from '@remix-run/react'
import { atom, useAtom } from 'jotai'
import { useEffect } from 'react'

const scrollStateAtom = atom({} as Record<string, number>)

function getKey(location: { key: string }, key: string | number | undefined) {
  return location.key + (key !== undefined ? ':' + key : '')
}

export function useScrollRestore({
  key,
}: { key?: string | number } | undefined = {}) {
  const [scrollState, setScrollState] = useAtom(scrollStateAtom)
  const location = useLocation()
  const navigation = useNavigation()
  const scrollStateKey = getKey(location, key)

  useEffect(() => {
    if (navigation.location) {
      const scrollKey = getKey(location, key)

      setScrollState({
        ...scrollState,
        [scrollKey]: window.scrollY,
      })
    }
  }, [navigation?.location])

  return scrollState[scrollStateKey]
}
