import { useEffect, useState } from 'react'
import { z } from 'zod'

export function useTipRequestSubscription(paymentRequestId?: string) {
  const [result, setResult] = useState<'success' | 'error' | 'pending'>(
    'pending'
  )

  useEffect(() => {
    if (!paymentRequestId) return
    if (result !== 'pending') return

    const source = new EventSource(
      `${window.env.PAYGATE_URL}/api/payment-request/subscribe/${paymentRequestId}`,
      {}
    )

    const handler = (event: MessageEvent) => {
      const result = z.enum(['success', 'error']).safeParse(event.data)
      setResult(result.success ? result.data : 'error')
    }

    source.addEventListener('message', handler)

    return () => {
      source.removeEventListener('message', handler)
      source.close()
    }
  }, [result, paymentRequestId])

  return result
}
