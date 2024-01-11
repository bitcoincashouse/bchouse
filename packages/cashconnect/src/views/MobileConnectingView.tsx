import { WCButton } from '../components/Button'
import { InfoFooter } from '../components/InfoFooter'
import { Content } from '../components/ModalContent'
import { WCHeader } from '../components/ModalHeader'
import { WCText } from '../components/Text'
import { WalletImage } from '../components/WalletImage'
import { RouterCtrl } from '../core/controllers/RouterCtrl'
import { WalletData } from '../core/types/controllerTypes'
import { CoreUtil } from '../core/utils/CoreUtil'
import { ConnectorWaiting } from '../partials/ConnectorWaiting'
import { PlatformSelection } from '../partials/PlatformSelection'
import { SvgUtil } from '../utils/SvgUtil'
import { UiUtil } from '../utils/UiUtil'

async function onFormatAndRedirect(
  wallet: WalletData,
  uri?: string,
  forceUniversalUrl = false
) {
  const { mobile } = wallet
  const url =
    uri ||
    (await CoreUtil.getWalletValue(
      forceUniversalUrl ? mobile?.universal : mobile?.native
    ))

  if (!url) return
  CoreUtil.openHref(url, '_self')
}

function openMobileApp(
  wallet: WalletData,
  uri?: string,
  forceUniversalUrl = false
) {
  UiUtil.setRecentWallet(wallet)
  onFormatAndRedirect(wallet, uri, forceUniversalUrl)
}

export function MobileConnectingView({
  wallet,
  isError = false,
  onGoBack,
  showBackBtn = false,
  uri,
}: {
  uri?: string
  wallet: WalletData
  isError?: boolean
  onGoBack?: () => void
  showBackBtn?: boolean
}) {
  function onQrcode() {
    RouterCtrl.push('Qrcode')
  }

  function onGoToAppStore(downloadUrl?: string) {
    if (downloadUrl) {
      CoreUtil.openHref(downloadUrl, '_blank')
    }
  }

  const downloadUrl = wallet.app?.ios
  const universalUrl = wallet.mobile?.universal
  const isWeb = Boolean(wallet.desktop?.universal)

  return (
    <div className="wcm-mobile-connecting-view">
      <WCHeader
        title={wallet.name}
        showBackBtn={showBackBtn}
        onGoBack={onGoBack}
        onAction={onQrcode}
        actionIcon={SvgUtil.QRCODE_ICON}
      ></WCHeader>

      <Content>
        <ConnectorWaiting
          wallet={wallet}
          label="Tap 'Open' to continue…"
          isError={isError}
        ></ConnectorWaiting>
      </Content>

      <InfoFooter className="wcm-note">
        <PlatformSelection isWeb={isWeb} isRetry={true}>
          <WCButton
            onClick={() => openMobileApp(wallet, uri, false)}
            iconRight={SvgUtil.RETRY_ICON}
          >
            Retry
          </WCButton>
        </PlatformSelection>

        {universalUrl ? (
          <WCText color="secondary" variant="small-thin">
            Still doesn't work?
            <span tabIndex={0} onClick={() => openMobileApp(wallet, uri, true)}>
              Try this alternate link
            </span>
          </WCText>
        ) : null}
      </InfoFooter>

      <InfoFooter className="wcm-app-store">
        <div>
          <WalletImage wallet={wallet}></WalletImage>
          <WCText>Get {wallet.name}</WCText>
        </div>
        <WCButton
          iconRight={SvgUtil.ARROW_RIGHT_ICON}
          onClick={() => onGoToAppStore(downloadUrl)}
          variant="ghost"
        >
          App Store
        </WCButton>
      </InfoFooter>
    </div>
  )
}
