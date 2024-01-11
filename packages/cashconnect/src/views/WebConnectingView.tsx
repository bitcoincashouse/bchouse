import { useEffect } from 'react'
import { WCButton } from '../components/Button'
import { InfoFooter } from '../components/InfoFooter'
import { Content } from '../components/ModalContent'
import { WCHeader } from '../components/ModalHeader'
import { WCText } from '../components/Text'
import { OptionsCtrl } from '../core/controllers/OptionsCtrl'
import { WalletData } from '../core/types/controllerTypes'
import { CoreUtil } from '../core/utils/CoreUtil'
import { ConnectorWaiting } from '../partials/ConnectorWaiting'
import { PlatformSelection } from '../partials/PlatformSelection'
import { SvgUtil } from '../utils/SvgUtil'
import { UiUtil } from '../utils/UiUtil'

async function onFormatAndRedirect(
  wallet: WalletData,
  uri: string | undefined,
  reopen?: boolean
) {
  const { desktop, name, disableLinkFormatting } = wallet
  const universalUrl = await CoreUtil.getWalletValue(desktop?.universal)

  if (!universalUrl) return

  if (disableLinkFormatting) {
    CoreUtil.openHref(universalUrl, '_blank')
  } else if (uri) {
    const href = CoreUtil.formatUniversalUrl(universalUrl, uri, name)
    CoreUtil.openHref(href, '_blank')
  } else if (reopen) {
    CoreUtil.openHref(universalUrl, '_blank')
  }
}

function openWebWallet(wallet: WalletData, uri?: string, reopen?: boolean) {
  const { walletConnectUri } = OptionsCtrl.state
  UiUtil.setRecentWallet(wallet)
  onFormatAndRedirect(wallet, uri || walletConnectUri, reopen)
}

export function WebConnectingView({
  wallet,
  isError = false,
  uri,
  onGoBack,
  showBackBtn = false,
  reopen,
}: {
  reopen?: boolean
  uri?: string
  wallet: WalletData
  isError?: boolean
  onGoBack?: () => void
  showBackBtn?: boolean
}) {
  const isMobilePlatform = CoreUtil.isMobile()

  useEffect(() => {
    if (uri) {
      openWebWallet(wallet, uri)
    }
  }, [uri])

  return (
    <div className="wcm-web-connecting-view">
      <WCHeader
        title={wallet.name}
        onAction={UiUtil.handleUriCopy}
        actionIcon={SvgUtil.COPY_ICON}
        showBackBtn={showBackBtn}
        onGoBack={onGoBack}
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
          {`${name} web app has opened in a new tab. Go there, accept the connection, and come back`}
        </WCText>

        <PlatformSelection
          isMobile={!!wallet.mobile}
          isDesktop={isMobilePlatform ? false : !!wallet.desktop}
          isRetry={true}
        >
          <WCButton
            onClick={() => openWebWallet(wallet, uri, reopen)}
            iconRight={SvgUtil.RETRY_ICON}
          >
            Retry
          </WCButton>
        </PlatformSelection>
      </InfoFooter>
    </div>
  )
}
