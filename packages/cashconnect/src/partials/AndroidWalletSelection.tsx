import { useMemo } from 'react'
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

export function AndroidWalletSelection({
  onSelect,
  title = 'Connect your wallet',
  network,
  protocols,
  footer,
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
      showDesktopWalletsOnMobile,
    },
  } = useWalletConnectContext()

  const isExplorerWallets =
    explorerExcludedWalletIds !== 'ALL' && enableExplorer

  const { desktop, android, web } = useWallets({ network, protocols })

  const platformTemplate = useMemo(() => {
    return [...android, ...web].filter((w) => !w.disableOnMobile)
  }, [android, web])

  const isManualViewAll = platformTemplate.length > 4 || isExplorerWallets
  const wallets = useMemo(() => {
    if (isManualViewAll) {
      return platformTemplate.slice(0, 3)
    } else {
      return platformTemplate
    }
  }, [platformTemplate, isManualViewAll])

  const desktopTemplates = useMemo(() => {
    return [...desktop, ...web].filter((w) => !w.disableOnMobile)
  }, [desktop, web])
  const isDesktopViewAll = desktopTemplates.length > 8 || isExplorerWallets
  const desktopWallets = useMemo(() => {
    if (isDesktopViewAll) {
      return desktopTemplates.slice(0, 7)
    } else {
      return desktopTemplates
    }
  }, [desktop, isDesktopViewAll])

  const isWallets = Boolean(wallets.length)
  const BODY =
    showDesktopWalletsOnMobile && desktopWallets.length ? (
      <div className="p-[10px] pt-0 -mt-[10px] w-full">
        <div className="wcm-desktop-title">
          {SvgUtil.DESKTOP_ICON}
          <Text variant="small-regular" color="accent">
            Desktop
          </Text>
        </div>

        <div className="wcm-grid">
          {desktopWallets.map((wallet) => (
            <WalletButton
              key={wallet.id}
              wallet={wallet}
              onClick={() => onSelect(wallet)}
            ></WalletButton>
          ))}
          {isDesktopViewAll ? <ViewAllWalletsButton /> : null}
        </div>
      </div>
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
            {SvgUtil.MOBILE_ICON}
            <Text variant="small-regular" color="accent">
              Mobile
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
      ) : (
        <div className="pb-6 px-2 flex flex-col gap-2">
          <WCText variant="big-bold" className="text-center" color="tertiary">
            Sorry, currently there isn't any wallet support for mobile yet.
          </WCText>
        </div>
      )}

      {footer}
    </div>
  )
}
