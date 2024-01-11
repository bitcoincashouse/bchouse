import { WCButton } from '../components/Button'
import { InfoFooter } from '../components/InfoFooter'
import { Content } from '../components/ModalContent'
import { WCHeader } from '../components/ModalHeader'
import { WCText } from '../components/Text'
import { WalletData } from '../core/types/controllerTypes'
import { CoreUtil } from '../core/utils/CoreUtil'
import { ConnectorWaiting } from '../partials/ConnectorWaiting'
import { SvgUtil } from '../utils/SvgUtil'

export function InstallWalletView({
  wallet,
  onGoBack,
  showBackBtn = false,
}: {
  wallet: WalletData
  isError?: boolean
  onGoBack?: () => void
  showBackBtn?: boolean
}) {
  function onInstall(uri?: string) {
    if (uri) {
      CoreUtil.openHref(uri, '_blank')
    }
  }

  return (
    <div className="wcm-install-wallet-view">
      <WCHeader
        title={wallet.name}
        showBackBtn={showBackBtn}
        onGoBack={onGoBack}
      ></WCHeader>

      <Content>
        <ConnectorWaiting
          wallet={wallet}
          label="Not Detected"
          isStale={true}
        ></ConnectorWaiting>
      </Content>

      <InfoFooter>
        <WCText color="secondary" variant="small-thin">
          Download {wallet.name} to continue. If multiple browser extensions are
          installed, disable non {wallet.name} ones and try again
        </WCText>

        <WCButton
          onClick={() => onInstall(wallet.homepage)}
          iconLeft={SvgUtil.ARROW_DOWN_ICON}
        >
          Download
        </WCButton>
      </InfoFooter>
    </div>
  )
}
