import { Content } from '../components/ModalContent'
import { WCHeader } from '../components/ModalHeader'
import { PlainConnectQr } from '../partials/PlainConnectQr'
import { SvgUtil } from '../utils/SvgUtil'
import { UiUtil } from '../utils/UiUtil'

export function PlainQrCodeView({
  imageAlt,
  imageUrl,
  uri,
  title = 'Scan the code',
  subtitle,
  onGoBack,
  showBackBtn = false,
  footer,
}: {
  imageAlt?: string
  imageUrl?: string
  uri?: string
  title?: React.ReactNode
  isError?: boolean
  onGoBack?: () => void
  showBackBtn?: boolean
  footer?: React.ReactNode
  subtitle?: React.ReactNode
}) {
  return (
    <div className="wcm-qrcode-view">
      <WCHeader
        title={title}
        onAction={() => UiUtil.handleUriCopy(uri)}
        actionIcon={SvgUtil.COPY_ICON}
        showBackBtn={showBackBtn}
        onGoBack={onGoBack}
      ></WCHeader>

      {subtitle}

      <Content>
        <PlainConnectQr
          imageAlt={imageAlt}
          imageUrl={imageUrl}
          uri={uri}
        ></PlainConnectQr>
      </Content>

      {footer}
    </div>
  )
}
