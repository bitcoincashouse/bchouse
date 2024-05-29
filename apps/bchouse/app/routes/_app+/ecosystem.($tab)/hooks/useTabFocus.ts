import { useBrowserLayoutEffect } from '~/utils/useBrowserLayoutEffect'

export function useTabFocus(currentTabRef: React.RefObject<HTMLAnchorElement>) {
  useBrowserLayoutEffect(() => {
    const findOverflowXParent = (element: HTMLElement) => {
      let parent = element.parentNode

      while (parent) {
        const styles = window.getComputedStyle(parent as HTMLElement)
        const overflowX = styles.overflowX

        if (overflowX === 'auto' || overflowX === 'scroll') {
          return parent
        }

        parent = parent.parentNode
      }

      return null
    }

    if (currentTabRef.current) {
      const parent = findOverflowXParent(
        currentTabRef.current
      ) as HTMLElement | null

      if (!parent) return

      // Calculate the scrollLeft to bring the element into view
      const scrollLeft =
        currentTabRef.current.offsetLeft -
        parent.offsetWidth / 2 +
        currentTabRef.current.offsetWidth / 2

      // Scroll horizontally
      parent.scrollTo({
        left: scrollLeft,
        behavior: 'instant',
      })
    }
  }, [])
}
