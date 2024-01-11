import { WalletButton } from '../components/WalletButton'
import { WalletData } from '../core/types/controllerTypes'
import { DataUtil } from './DataUtil'
import { UiUtil } from './UiUtil'

export const TemplateUtil = {
  onConnecting(data: WalletData) {
    UiUtil.goToConnectingView(data)
  },

  toNode(wallets: WalletData[]) {
    return wallets.map((wallet) => (
      <WalletButton
        key={wallet.id}
        name={wallet.name}
        wallet={wallet}
        onClick={() => this.onConnecting(wallet)}
      ></WalletButton>
    ))
  },

  manualWalletsTemplate() {
    const wallets = DataUtil.manualWallets()

    return wallets.map((wallet) => (
      <WalletButton
        key={wallet.id}
        name={wallet.name}
        wallet={wallet}
        onClick={() => this.onConnecting(wallet)}
      ></WalletButton>
    ))
  },

  mobileWalletsTemplate() {
    const wallets = DataUtil.mobileWallets()

    return wallets.map((wallet) => (
      <WalletButton
        key={wallet.id}
        name={wallet.name}
        wallet={wallet}
        onClick={() => this.onConnecting(wallet)}
      ></WalletButton>
    ))
  },

  desktopWalletsTemplate() {
    const wallets = DataUtil.desktopWallets()

    return wallets.map((wallet) => (
      <WalletButton
        key={wallet.id}
        name={wallet.name}
        wallet={wallet}
        onClick={() => this.onConnecting(wallet)}
      ></WalletButton>
    ))
  },

  recomendedWalletsTemplate(skipRecent = false) {
    const wallets = DataUtil.recomendedWallets(skipRecent)

    return wallets.map((wallet) => (
      <WalletButton
        key={wallet.id}
        name={wallet.name}
        wallet={wallet}
        onClick={() => this.onConnecting(wallet)}
      ></WalletButton>
    ))
  },

  recentWalletTemplate() {
    const wallet = DataUtil.recentWallet()

    if (!wallet) {
      return undefined
    }

    return (
      <WalletButton
        key={wallet.id}
        name={wallet.name}
        wallet={wallet}
        recent={true}
        onClick={() => this.onConnecting(wallet)}
      ></WalletButton>
    )
  },
}
