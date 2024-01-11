import { EventsCtrl } from '../core/controllers/EventsCtrl'
import { WalletData } from '../core/types/controllerTypes'
import { UiUtil } from '../utils/UiUtil'
import { Text } from './Text'
import { WalletImage } from './WalletImage'

export function WalletButton({
  wallet,
  label,
  installed = false,
  recent = false,
  onClick,
}: {
  onClick: () => void
  wallet: WalletData
  label?: string
  installed?: boolean
  recent?: boolean
} & React.ComponentProps<'button'>) {
  function sublabelTemplate() {
    if (recent) {
      return (
        <Text className="wcm-sublabel" variant="xsmall-bold" color="tertiary">
          RECENT
        </Text>
      )
    } else if (installed) {
      return (
        <Text className="wcm-sublabel" variant="xsmall-bold" color="tertiary">
          INSTALLED
        </Text>
      )
    }

    return null
  }

  function handleClick() {
    EventsCtrl.click({ name: 'WALLET_BUTTON', walletId: wallet.id })
    onClick?.()
  }

  return (
    <div className="wcm-wallet-button">
      <button onClick={handleClick}>
        <div>
          <WalletImage wallet={wallet} />
          <Text variant="xsmall-regular">
            {label ?? UiUtil.getWalletName(wallet.name, true)}
          </Text>

          {sublabelTemplate()}
        </div>
      </button>
    </div>
  )
}
