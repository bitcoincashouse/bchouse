import { useEffect, useRef, useState } from 'react'
import { PlainQrCode } from '../components/PlainQrCode'
import { Spinner } from '../components/Spinner'

export function PlainConnectQr({
  imageUrl,
  imageAlt,
  uri,
}: {
  imageAlt?: string
  imageUrl?: string
  uri?: string
}) {
  const overlayRef = useRef<HTMLDivElement>(null)
  const [qrValue, setQrValue] = useState<string | undefined>()

  // -- lifecycle ---------------------------------------------------- //
  useEffect(() => {
    setTimeout(async () => {
      setQrValue(uri)
    }, 0)
  }, [uri])

  return (
    <div ref={overlayRef} className="wcm-walletconnect-qr">
      <div className="wcm-qr-container">
        {qrValue ? (
          <PlainQrCode
            size={overlayRef.current?.offsetWidth}
            uri={qrValue}
            imageUrl={imageUrl}
            imageAlt={imageAlt}
          />
        ) : (
          <Spinner className="flex justify-center"></Spinner>
        )}
      </div>
    </div>
  )
}
