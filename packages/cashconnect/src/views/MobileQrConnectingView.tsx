import { InfoFooter } from '../components/InfoFooter'
import { Content } from '../components/ModalContent'
import { WCHeader } from '../components/ModalHeader'
import { WCText } from '../components/Text'
import { WalletData } from '../core/types/controllerTypes'
import { CoreUtil } from '../core/utils/CoreUtil'
import { PlatformSelection } from '../partials/PlatformSelection'
import { WalletConnectQr } from '../partials/WalletConnectQr'
import { SvgUtil } from '../utils/SvgUtil'
import { UiUtil } from '../utils/UiUtil'

const isMobileDevice = CoreUtil.isMobile()

export function MobileQrConnectingView({
  wallet,
  title,
  isError = false,
  onGoBack,
  uri,
  showBackBtn = false,
}: {
  uri?: string
  title?: string
  wallet: WalletData
  isError?: boolean
  onGoBack?: () => void
  showBackBtn?: boolean
}) {
  const isDesktop = Boolean(wallet.desktop?.native)
  const isWeb = Boolean(wallet.desktop?.universal)
  const isMobile =
    Boolean(wallet.mobile?.native) || Boolean(wallet.mobile?.universal)

  return (
    <div className="wcm-mobile-qr-connecting-view">
      <WCHeader
        title={title || wallet.name}
        onAction={async () => {
          const openUri =
            uri ||
            (await CoreUtil.getWalletValue(
              (isMobileDevice
                ? wallet.mobile?.native
                : wallet.desktop?.native) ||
                wallet.mobile?.native ||
                wallet.desktop?.native
            ))
          UiUtil.handleUriCopy(openUri)
        }}
        actionIcon={SvgUtil.COPY_ICON}
        showBackBtn={showBackBtn}
        onGoBack={onGoBack}
        className={title ? '!pb-1' : ''}
      ></WCHeader>
      {title ? (
        <div className="wcm-subtitle pb-[20px]">
          <WCText variant="small-regular" color="accent">
            {wallet.name}
          </WCText>
        </div>
      ) : null}

      <Content>
        <WalletConnectQr uri={uri} wallet={wallet}></WalletConnectQr>
      </Content>

      <InfoFooter>
        <WCText color="secondary" variant="small-thin">
          {`Scan this QR Code with your phone's camera or inside ${name} app`}
        </WCText>

        <PlatformSelection
          isDesktop={isDesktop}
          isWeb={isWeb}
        ></PlatformSelection>
      </InfoFooter>
    </div>
  )
}
