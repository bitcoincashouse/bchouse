import { useLocation, useNavigation } from '@remix-run/react'
import { atom, useAtom } from 'jotai'
import { useEffect, useMemo, useRef } from 'react'
import { StateSnapshot, VirtuosoHandle } from 'react-virtuoso'
import { PostCardModel } from '../post/types'

const feedStateAtom = atom({} as Record<string, StateSnapshot>)

function getKey(location: { key: string }, key: string | number | undefined) {
  return location.key + (key !== undefined ? ':' + key : '')
}
export function useFeedState({ key }: { key?: string | number }) {
  const [feedState, setFeedState] = useAtom(feedStateAtom)
  const feedRef = useRef<VirtuosoHandle>()
  const location = useLocation()
  const navigation = useNavigation()
  const feedStateKey = getKey(location, key)

  useEffect(() => {
    if (navigation.location) {
      feedRef.current?.getState((state) => {
        const feedKey = getKey(location, key)

        setFeedState({
          ...feedState,
          [feedKey]: state,
        })

        // const nextFeedKey = getKey(navigation.location, key)
        // if (navigation.location.pathname === location.pathname) {
        //   setFeedState({
        //     ...feedState,
        //     [nextFeedKey]: state,
        //   })
        // }
      })
    }
  }, [navigation?.location])

  return {
    feedRef,
    feedState: feedState[feedStateKey],
  }
}

export function useInfiniteScroll({
  initialPosts,
  mainPostId,
  key,
}: {
  key?: string | number
  mainPostId: string
  initialPosts: PostCardModel[]
}) {
  const { feedRef, feedState } = useFeedState({ key })

  const { firstItemIndex, initialTopMostItemIndex } = useMemo(() => {
    const mainItemIndex =
      initialPosts.findIndex((p) => p.id === mainPostId) || 0

    return {
      firstItemIndex: 10000 - mainItemIndex,
      initialTopMostItemIndex: mainItemIndex,
    }
  }, [initialPosts])

  return {
    feedRef,
    feedState,
    posts: initialPosts,
    initialTopMostItemIndex,
    firstItemIndex,
  }
}
