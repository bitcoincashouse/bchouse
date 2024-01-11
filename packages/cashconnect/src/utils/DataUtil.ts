import { ConfigCtrl } from '../core/controllers/ConfigCtrl'
import { ExplorerCtrl } from '../core/controllers/ExplorerCtrl'
import { WalletData } from '../core/types/controllerTypes'
import { CoreUtil } from '../core/utils/CoreUtil'
import { UiUtil } from './UiUtil'

export const DataUtil = {
  manualWallets() {
    const { mobileWallets, desktopWallets } = ConfigCtrl.state
    const platformWallets = CoreUtil.isMobile() ? mobileWallets : desktopWallets

    return ((CoreUtil.isMobile()
      ? platformWallets?.map(
          ({
            id,
            name,
            links,
            disableLinkFormatting,
            image,
            networks,
            protocols,
          }) => ({
            id,
            name,
            mobile: links,
            image,
            links,
            disableLinkFormatting,
            networks,
            protocols,
          })
        )
      : platformWallets?.map(
          ({
            id,
            name,
            links,
            disableLinkFormatting,
            image,
            networks,
            protocols,
          }) => ({
            id,
            name,
            desktop: links,
            image,
            links,
            disableLinkFormatting,
            networks,
            protocols,
          })
        )) ?? []) as WalletData[]
  },

  mobileWallets() {
    const { mobileWallets } = ConfigCtrl.state

    return (
      mobileWallets?.map(
        ({
          id,
          name,
          links,
          disableLinkFormatting,
          image,
          networks,
          protocols,
        }) => ({
          id,
          name,
          mobile: links,
          links,
          image,
          disableLinkFormatting,
          networks,
          protocols,
        })
      ) ?? []
    )
  },

  desktopWallets() {
    const { desktopWallets } = ConfigCtrl.state

    return (
      desktopWallets?.map(
        ({
          id,
          name,
          links,
          disableLinkFormatting,
          image,
          networks,
          protocols,
        }) => ({
          id,
          name,
          desktop: links,
          links,
          image,
          disableLinkFormatting,
          networks,
          protocols,
        })
      ) ?? []
    )
  },

  allWallets() {
    const manualTemplate = this.manualWallets()
    const mobileTemplates = this.mobileWallets()
    const recomendedTemplate = this.recomendedWallets()

    return [
      ...manualTemplate,
      ...mobileTemplates,
      ...recomendedTemplate,
    ].filter(Boolean) as WalletData[]
  },

  recentWallet() {
    return UiUtil.getRecentWallet()
  },

  recomendedWallets(skipRecent = false) {
    const recentWalletId = skipRecent ? undefined : DataUtil.recentWallet()?.id
    const { recomendedWallets } = ExplorerCtrl.state
    const wallets = recomendedWallets.filter(
      (wallet) => recentWalletId !== wallet.id
    )

    return wallets
  },
}
