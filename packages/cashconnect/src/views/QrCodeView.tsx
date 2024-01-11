import { Content } from '../components/ModalContent'
import { WCHeader } from '../components/ModalHeader'
import { WalletConnectQr } from '../partials/WalletConnectQr'
import { SvgUtil } from '../utils/SvgUtil'
import { UiUtil } from '../utils/UiUtil'

export function QrCodeView({
  walletId,
  isError = false,
  onGoBack,
  showBackBtn = false,
}: {
  walletId: string
  isError?: boolean
  onGoBack?: () => void
  showBackBtn?: boolean
}) {
  return (
    <div className="wcm-qrcode-view">
      <WCHeader
        title="Scan the code"
        onAction={UiUtil.handleUriCopy}
        actionIcon={SvgUtil.COPY_ICON}
        showBackBtn={showBackBtn}
        onGoBack={onGoBack}
      ></WCHeader>

      <Content>
        <WalletConnectQr></WalletConnectQr>
      </Content>
    </div>
  )
}
