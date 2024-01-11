import { useMemo } from 'react'
import {
  Platform,
  Wallet,
  WalletData,
  WalletNetwork,
  WalletProtocol,
} from '../core/types/controllerTypes'
import { useWalletConnectContext } from '../partials/Modal'

export const useWallets = ({
  network,
  protocols,
}: {
  network?: WalletNetwork
  protocols?: WalletProtocol[]
}) => {
  const {
    config: { wallets },
  } = useWalletConnectContext()
  return useMemo(() => {
    let all = [] as WalletData[],
      desktop = [] as WalletData[],
      chromeExtension = [] as WalletData[],
      android = [] as WalletData[],
      ios = [] as WalletData[],
      web = [] as WalletData[],
      mobile = [] as WalletData[]

    for (let i = 0; i < wallets.length; i++) {
      const wallet = wallets[i] as Wallet
      const walletData = {
        id: wallet.id,
        desktop: wallet.links,
        name: wallet.name,
        image: wallet.image,
        links: wallet.links,
        disableLinkFormatting: wallet.disableLinkFormatting,
        networks: wallet.networks,
        protocols: wallet.protocols,
        disableOnMobile: wallet.disableOnMobile,
      }

      if (network && wallet.networks.indexOf(network) === -1) continue
      if (
        protocols &&
        !protocols.some((protocol) => wallet.protocols.indexOf(protocol) !== -1)
      )
        continue

      let isMobile = false
      for (let j = 0; j < wallet.platforms.length; j++) {
        const platform = wallet.platforms[j] as Platform

        all.push(walletData)

        if (platform === 'desktop') {
          desktop.push(walletData)
        } else if (platform === 'chrome-extension') {
          chromeExtension.push(walletData)
        } else if (platform === 'web') {
          web.push(walletData)
        } else if (platform === 'android') {
          isMobile = true
          android.push(walletData)
        } else if (platform === 'ios') {
          isMobile = true
          ios.push(walletData)
        }
      }

      if (isMobile) {
        mobile.push(walletData)
      }
    }

    return {
      all,
      desktop,
      android,
      ios,
      chromeExtension,
      mobile,
      web,
    }
  }, [wallets])
}
