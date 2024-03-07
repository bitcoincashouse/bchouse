import { PlainQrCodeView } from '@bchouse/cashconnect'
import { useRevalidator } from '@remix-run/react'
import { useEffect } from 'react'
import { bchLogo } from '~/utils/constants'
import { usePledgeRequestSubscription } from '~/utils/usePledgeRequestSubscription'

export function PaymentView({
  nextStep,
  requestId,
  paymentUrl,
  onGoBack,
}: {
  requestId?: string
  paymentUrl?: string
  nextStep: () => void
  onGoBack: () => void
}) {
  const paymentStatus = usePledgeRequestSubscription(requestId)
  const revalidator = useRevalidator()

  useEffect(() => {
    if (paymentStatus === 'success') {
      revalidator.revalidate()

      if (document.visibilityState === 'visible') {
        const timeoutId = setTimeout(() => nextStep(), 1500)

        return () => clearTimeout(timeoutId)
      } else {
        //Handle refocus
        const handleFocus = () => setTimeout(() => nextStep(), 2000)

        if (typeof window !== 'undefined' && window.addEventListener) {
          window.addEventListener('visibilitychange', handleFocus, false)
          window.addEventListener('focus', handleFocus, false)
        }

        return () => {
          // Be sure to unsubscribe if a new handler is set
          window.removeEventListener('visibilitychange', handleFocus)
          window.removeEventListener('focus', handleFocus)
        }
      }
    }

    return
  }, [paymentStatus])

  const title =
    paymentStatus === 'error'
      ? 'Pledge failed'
      : paymentStatus === 'success'
      ? 'Pledge succeeded'
      : 'Campaign pledge'

  return (
    <PlainQrCodeView
      title={title}
      uri={paymentUrl}
      imageAlt="Donation address QR"
      imageUrl={bchLogo}
      onGoBack={onGoBack}
      showBackBtn
    />
  )
}
