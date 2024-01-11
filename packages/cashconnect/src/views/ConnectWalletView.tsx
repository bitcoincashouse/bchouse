import {
  WalletData,
  WalletNetwork,
  WalletProtocol,
} from '../core/types/controllerTypes'
import { CoreUtil } from '../core/utils/CoreUtil'
import { AndroidWalletSelection } from '../partials/AndroidWalletSelection'
import { DesktopWalletSelection } from '../partials/DesktopWalletSelection'
import { MobileWalletSelection } from '../partials/MobileWalletSelection'

export function ConnectWalletView({
  onSelectWallet,
  title,
  network,
  protocols,
  footer,
}: {
  network?: WalletNetwork
  protocols?: WalletProtocol[]
  title?: string
  onSelectWallet: (wallet: WalletData) => void
  footer?: React.ReactNode
}) {
  function viewTemplate() {
    if (CoreUtil.isAndroid()) {
      return (
        <AndroidWalletSelection
          title={title}
          onSelect={onSelectWallet}
          network={network}
          protocols={protocols}
          footer={footer}
        />
      )
    }

    if (CoreUtil.isMobile()) {
      return (
        <MobileWalletSelection
          title={title}
          onSelect={onSelectWallet}
          network={network}
          protocols={protocols}
          footer={footer}
        />
      )
    }

    return (
      <DesktopWalletSelection
        title={title}
        onSelect={onSelectWallet}
        network={network}
        protocols={protocols}
        footer={footer}
      />
    )
  }

  // -- render ------------------------------------------------------- //
  return <>{viewTemplate()}</>
}
