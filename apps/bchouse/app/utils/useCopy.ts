import copyToClipboard from 'copy-to-clipboard'
import { useCallback, useRef, useState } from 'react'

export default function useCopy(
  copyText: string,
  {
    timeout = 2000,
    options,
  }: {
    timeout?: number
    options?: Parameters<typeof copyToClipboard>['1']
  } = {}
) {
  const copyTextRef = useRef<string>()
  copyTextRef.current = copyText

  const [showSuccessfulCopy, setShowSuccessfulCopy] = useState(false)
  const copy = useCallback(() => {
    if (copyTextRef.current) {
      copyToClipboard(copyTextRef.current, options)

      setShowSuccessfulCopy(true)
      setTimeout(() => {
        setShowSuccessfulCopy(false)
      }, timeout)
    }

    return
  }, [copyText])

  return [copy, showSuccessfulCopy] as const
}
