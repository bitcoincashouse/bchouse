import { WCText } from '../components/Text'
import { ExplorerCtrl } from '../core/controllers/ExplorerCtrl'
import { RouterCtrl } from '../core/controllers/RouterCtrl'
import { DataUtil } from '../utils/DataUtil'
import { SvgUtil } from '../utils/SvgUtil'
import { UiUtil } from '../utils/UiUtil'

export function ViewAllWalletsButton() {
  function onClick() {
    RouterCtrl.push('WalletExplorer')
  }

  const { recomendedWallets } = ExplorerCtrl.state
  const manualWallets = DataUtil.manualWallets()
  const reversedWallets = [...recomendedWallets, ...manualWallets]
    .reverse()
    .slice(0, 4)

  return (
    <button className="wcm-view-all-wallets-button" onClick={onClick}>
      <div className="wcm-icons">
        {reversedWallets.map((wallet) => {
          const explorerImg = UiUtil.getWalletIcon(wallet)
          if (explorerImg) {
            return <img crossOrigin="anonymous" src={explorerImg} />
          }
          const src = UiUtil.getWalletIcon({ id: wallet.id })

          return src ? (
            <img crossOrigin="anonymous" src={src} />
          ) : (
            SvgUtil.WALLET_PLACEHOLDER
          )
        })}
        {[...Array(4 - reversedWallets.length)].map(
          () => SvgUtil.WALLET_PLACEHOLDER
        )}
      </div>
      <WCText variant="xsmall-regular">View All</WCText>
    </button>
  )
}
