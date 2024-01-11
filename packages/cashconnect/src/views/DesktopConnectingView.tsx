import { useEffect } from 'react'
import { WCButton } from '../components/Button'
import { InfoFooter } from '../components/InfoFooter'
import { Content } from '../components/ModalContent'
import { WCHeader } from '../components/ModalHeader'
import { WCText } from '../components/Text'
import { WalletData } from '../core/types/controllerTypes'
import { CoreUtil } from '../core/utils/CoreUtil'
import { ConnectorWaiting } from '../partials/ConnectorWaiting'
import { PlatformSelection } from '../partials/PlatformSelection'
import { SvgUtil } from '../utils/SvgUtil'
import { UiUtil } from '../utils/UiUtil'

async function onFormatAndRedirect(wallet: WalletData, uri?: string) {
  const { desktop } = wallet
  const nativeUrl = uri || (await CoreUtil.getWalletValue(desktop?.native))

  if (!nativeUrl) return
  CoreUtil.openHref(nativeUrl, '_self')
}

function openDesktopApp(wallet: WalletData, uri?: string) {
  UiUtil.setRecentWallet(wallet)
  onFormatAndRedirect(wallet, uri)
}

export function DesktopConnectingView({
  wallet,
  uri,
  isError = false,
  onGoBack,
  showBackBtn = false,
}: {
  wallet: WalletData
  isError?: boolean
  uri?: string
  onGoBack?: () => void
  showBackBtn?: boolean
}) {
  useEffect(() => {
    openDesktopApp(wallet, uri)
  }, [wallet])

  const isWeb = Boolean(wallet.desktop?.universal)
  const isMobile =
    Boolean(wallet.mobile?.native) || Boolean(wallet.mobile?.universal)

  return (
    <div className="wcm-desktop-connecting-view">
      <WCHeader
        title={wallet.name}
        showBackBtn={showBackBtn}
        onGoBack={onGoBack}
        onAction={async () => {
          const { desktop } = wallet
          const nativeUrl = await CoreUtil.getWalletValue(desktop?.native)
          UiUtil.handleUriCopy(nativeUrl)
        }}
        actionIcon={SvgUtil.COPY_ICON}
      ></WCHeader>

      <Content>
        <ConnectorWaiting
          wallet={wallet}
          label={`Continue in ${wallet.name}...`}
          isError={isError}
        ></ConnectorWaiting>
      </Content>

      <InfoFooter>
        <WCText color="secondary" variant="small-thin">
          {`Connection can continue loading if ${wallet.name} is not installed on your device`}
        </WCText>

        <PlatformSelection isMobile={isMobile} isWeb={isWeb} isRetry={true}>
          <WCButton
            onClick={() => openDesktopApp(wallet, uri)}
            iconRight={SvgUtil.RETRY_ICON}
          >
            Retry
          </WCButton>
        </PlatformSelection>
      </InfoFooter>
    </div>
  )
}
