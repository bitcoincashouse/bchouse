import { useRef, useState } from 'react'
import { useBrowserLayoutEffect } from '~/utils/useBrowserLayoutEffect'
import { useScrollRestore } from './useScrollRestore'

export function useCommentScroll() {
  const feedRef = useRef<HTMLUListElement | null>(null)
  const scrollState = useScrollRestore()
  const [shouldRender, setWasRendered] = useState(false)

  useBrowserLayoutEffect(() => {
    if (typeof window === 'undefined') return

    if (scrollState) {
      window.scrollTo({ top: scrollState })
    } else {
      const mainPost = feedRef.current?.querySelector(
        '#currentPost'
      ) as HTMLDivElement

      if (mainPost) {
        const targetOffset =
          mainPost.offsetTop + (window.innerWidth >= 640 ? -60 : 0)

        window.scrollTo({ top: targetOffset, behavior: 'instant' })
      }
    }
    setWasRendered(true)
  }, [])

  return { feedRef, shouldRender }
}
