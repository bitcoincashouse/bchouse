import { useMemo } from 'react'
import { Content } from '../components/ModalContent'
import { Footer } from '../components/ModalFooter'
import { WCHeader } from '../components/ModalHeader'
import { Text, WCText } from '../components/Text'
import { WalletButton } from '../components/WalletButton'
import {
  WalletData,
  WalletNetwork,
  WalletProtocol,
} from '../core/types/controllerTypes'
import { SvgUtil } from '../utils/SvgUtil'
import { useWallets } from '../utils/useWallets'
import { useWalletConnectContext } from './Modal'
import { ViewAllWalletsButton } from './ViewAllWalletsButton'
import { WalletConnectQr } from './WalletConnectQr'

export function DesktopWalletSelection({
  onSelect,
  title = 'Connect your wallet',
  network,
  footer,
  protocols,
}: {
  network?: WalletNetwork
  onSelect: (wallet: WalletData) => void
  title?: string
  footer?: React.ReactNode
  protocols?: WalletProtocol[]
}) {
  const {
    config: {
      explorerExcludedWalletIds,
      enableExplorer,
      showMobileWalletsOnDesktop,
      scanMobileWalletOnDesktop,
    },
  } = useWalletConnectContext()

  const isExplorerWallets =
    explorerExcludedWalletIds !== 'ALL' && enableExplorer

  const { desktop, mobile, web } = useWallets({ network, protocols })

  const platformTemplate = useMemo(() => {
    return [...desktop, ...web]
  }, [desktop, web])

  const isManualViewAll = platformTemplate.length > 4 || isExplorerWallets
  const wallets = useMemo(() => {
    if (isManualViewAll) {
      return platformTemplate.slice(0, 3)
    } else {
      return platformTemplate
    }
  }, [platformTemplate, isManualViewAll])

  const mobileTemplates = mobile
  const isMobileViewAll = mobileTemplates.length > 8 || isExplorerWallets
  const mobileWallets = useMemo(() => {
    if (isMobileViewAll) {
      return mobileTemplates.slice(0, 7)
    } else {
      return mobileTemplates
    }
  }, [mobile, isMobileViewAll])

  const isWallets = Boolean(wallets.length)
  const BODY =
    showMobileWalletsOnDesktop && mobileWallets.length ? (
      <div className="p-[10px] pt-0 -mt-[10px] w-full">
        <div className="wcm-desktop-title">
          {SvgUtil.MOBILE_ICON}
          <Text variant="small-regular" color="accent">
            Mobile
          </Text>
        </div>

        <div className="wcm-grid">
          {mobileWallets.map((wallet) => (
            <WalletButton
              key={wallet.id}
              wallet={wallet}
              onClick={() => onSelect(wallet)}
            ></WalletButton>
          ))}
          {isMobileViewAll ? <ViewAllWalletsButton /> : null}
        </div>
      </div>
    ) : scanMobileWalletOnDesktop ? (
      <Content>
        <div className="wcm-mobile-title">
          <div className="wcm-subtitle">
            {SvgUtil.MOBILE_ICON}
            <Text variant="small-regular" color="accent">
              Mobile
            </Text>
          </div>

          <div className="wcm-subtitle">
            {SvgUtil.SCAN_ICON}
            <Text variant="small-regular" color="secondary">
              Scan with your wallet
            </Text>
          </div>
        </div>
        <WalletConnectQr />
      </Content>
    ) : null

  return (
    <div className="wcm-desktop-wallet-selection">
      <WCHeader
        border={!!BODY}
        title={title}
        // onAction={UiUtil.handleUriCopy}
        // actionIcon={SvgUtil.COPY_ICON}
      ></WCHeader>
      {BODY}
      {isWallets ? (
        <Footer>
          <div className="wcm-desktop-title">
            {SvgUtil.DESKTOP_ICON}
            <Text variant="small-regular" color="accent">
              Desktop
            </Text>
          </div>

          <div className="wcm-grid">
            {wallets.map((wallet) => (
              <WalletButton
                key={wallet.id}
                wallet={wallet}
                onClick={() => onSelect(wallet)}
              ></WalletButton>
            ))}
            {isManualViewAll ? <ViewAllWalletsButton /> : null}
          </div>
        </Footer>
      ) : !BODY ? (
        <div className="pb-6 px-2 flex flex-col gap-2">
          <WCText variant="big-bold" className="text-center" color="tertiary">
            Sorry, currently there isn't any wallet support for this platfom
            yet.
          </WCText>
        </div>
      ) : null}

      {footer}
    </div>
  )
}
