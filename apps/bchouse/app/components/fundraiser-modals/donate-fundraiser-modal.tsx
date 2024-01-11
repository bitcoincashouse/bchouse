import {
  PlainQrCodeView,
  WalletConnectModal,
  useWalletConnectContext,
} from '@bchouse/cashconnect'
import ReactDOM from 'react-dom'
import { ClientOnly } from '~/components/client-only'
import { bchLogo } from '~/utils/constants'

export function DonateModal({ address }: { address: string }) {
  return (
    <ClientOnly>
      {() =>
        ReactDOM.createPortal(
          <WalletConnectModal>
            <DonateRoutes address={address} />
          </WalletConnectModal>,
          document.querySelector('body') as HTMLElement
        )
      }
    </ClientOnly>
  )
}

function DonateRoutes({ address }: { address: string }) {
  const { close } = useWalletConnectContext()

  return (
    <div>
      <PlainQrCodeView
        title="Donation"
        uri={address}
        imageAlt="Donation address QR"
        imageUrl={bchLogo}
        onGoBack={() => close()}
        showBackBtn
      />
    </div>
  )
}
