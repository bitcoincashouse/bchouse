import { useEffect, useRef, useState } from 'react'
import { QrCode } from '../components/QrCode'
import { Spinner } from '../components/Spinner'
import { WalletData } from '../core/types/controllerTypes'
import { CoreUtil } from '../core/utils/CoreUtil'
import { DataUtil } from '../utils/DataUtil'

const isMobileDevice = CoreUtil.isMobile()

export function WalletConnectQr({
  wallet,
  uri,
}: {
  wallet?: WalletData
  uri?: string
}) {
  const [qrValue, setQrValue] = useState<string | undefined>()

  // -- lifecycle ---------------------------------------------------- //
  useEffect(() => {
    setTimeout(async () => {
      const currentWallet = wallet
        ? DataUtil.allWallets().find((w) => w.id === wallet.id)
        : undefined

      const qrValue =
        uri ||
        (await CoreUtil.getWalletValue(
          (isMobileDevice
            ? currentWallet?.mobile?.native
            : currentWallet?.desktop?.native) ||
            currentWallet?.mobile?.native ||
            currentWallet?.desktop?.native
        ))

      if (!qrValue) throw new Error('Invalid qr, no uri provided or found')
      setQrValue(qrValue)
    }, 0)
  }, [wallet?.id])

  // -- private ------------------------------------------------------ //
  const overlayRef = useRef<HTMLDivElement>(null)

  // -- render ------------------------------------------------------- //
  return (
    <div ref={overlayRef} className="wcm-walletconnect-qr wcm-qr-container">
      {qrValue ? (
        <QrCode
          size={overlayRef.current?.offsetWidth}
          uri={qrValue}
          wallet={wallet}
        ></QrCode>
      ) : (
        <Spinner></Spinner>
      )}
    </div>
  )
}
