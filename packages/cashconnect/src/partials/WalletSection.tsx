import { useMemo } from 'react'
import { CoreUtil } from '~/core/utils/CoreUtil'
import { useWalletConnectContext } from '~/partials/Modal'
import { ViewAllWalletsButton } from '~/partials/ViewAllWalletsButton'
import { Footer } from '../components/ModalFooter'
import { Text, WCText } from '../components/Text'
import { WalletButton } from '../components/WalletButton'
import {
  WalletData,
  WalletNetwork,
  WalletProtocol,
} from '../core/types/controllerTypes'
import { SvgUtil } from '../utils/SvgUtil'
import { useWallets } from '../utils/useWallets'

export function WalletSection({
  onSelect,
  network,
  protocols,
}: {
  onSelect: (wallet: WalletData) => void
  network?: WalletNetwork
  protocols?: WalletProtocol[]
}) {
  const {
    config: { explorerExcludedWalletIds, enableExplorer },
  } = useWalletConnectContext()

  const isExplorerWallets =
    explorerExcludedWalletIds !== 'ALL' && enableExplorer

  const { ios, web, desktop, android, chromeExtension, mobile } = useWallets({
    network,
    protocols,
  })

  const {
    platform,
    icon,
    wallets: platformTemplate,
  } = useMemo(() => {
    if (CoreUtil.isAndroid()) {
      return {
        platform: 'Mobile',
        icon: SvgUtil.MOBILE_ICON,
        wallets: [...android, ...web].filter((w) => !w.disableOnMobile),
      }
    }

    if (CoreUtil.isIos()) {
      return {
        platform: 'Mobile',
        icon: SvgUtil.MOBILE_ICON,
        wallets: [...ios, ...web].filter((w) => !w.disableOnMobile),
      }
    }

    if (CoreUtil.isMobile()) {
      return {
        platform: 'Mobile',
        icon: SvgUtil.MOBILE_ICON,
        wallets: [...mobile, ...web].filter((w) => !w.disableOnMobile),
      }
    }

    return {
      platform: 'Desktop',
      icon: SvgUtil.DESKTOP_ICON,
      wallets: [...desktop, ...chromeExtension, ...web],
    }
  }, [ios, web, desktop, android, chromeExtension])

  const isManualViewAll = platformTemplate.length > 4 || isExplorerWallets
  const wallets = useMemo(() => {
    if (isManualViewAll) {
      return platformTemplate.slice(0, 3)
    } else {
      return platformTemplate
    }
  }, [platformTemplate, isManualViewAll])

  const hasWallets = Boolean(wallets.length)

  return hasWallets ? (
    <Footer className="wcm-desktop-wallet-selection">
      <div className="wcm-desktop-title">
        {icon}
        <Text variant="small-regular" color="accent">
          {platform}
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
        Sorry, currently there isn't any wallet support for{' '}
        {platform.toLowerCase()} yet.
      </WCText>
    </div>
  )
}
