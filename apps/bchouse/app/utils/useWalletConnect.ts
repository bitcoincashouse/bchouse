import { OpenOptions } from '@bchouse/cashconnect'
import { useMemo } from 'react'

export function useWalletConnectConfig() {
  return useMemo((): OpenOptions['config'] => {
    return {
      projectId: '',
      chains: ['bch:bitcoincash'],
      disableRecentWallets: true,
      showMobileWalletsOnDesktop: true,
      scanMobileWalletOnDesktop: false,
      showDesktopWalletsOnMobile: true,
      enableExplorer: false,
      //TODO: somewhere filter wallets that aren't applicable to the feature being used
      wallets: [
        {
          id: 'electron_desktop',
          name: 'EC Desktop',
          image: '/assets/wallets/electroncash.png',
          protocols: ['bip70'],
          networks: ['mainnet', 'chipnet'],
          platforms: ['desktop'],
          disableOnMobile: true, //Disabled due to broken QR
        },
        {
          id: 'flipstarter_plugin',
          name: 'FS Plugin',
          image: '/assets/wallets/flipstarter.png',
          protocols: ['fs_plugin' as any],
          networks: ['mainnet', 'chipnet'],
          platforms: ['desktop'],
          disableOnMobile: true, //Disabled due to broken QR
        },
        {
          id: 'electron_mobile',
          name: 'EC Mobile',
          image: '/assets/wallets/electroncash.png',
          protocols: ['bip70'],
          networks: ['mainnet', 'chipnet'],
          platforms: ['ios', 'android'],
          disableOnMobile: true, //Disabled due to broken pasting payment uri
        },
        {
          id: 'bitcoin_com',
          name: 'Bitcoin.com',
          image: '/assets/wallets/bitcoindotcom.png',
          protocols: ['bip70'],
          networks: ['mainnet'],
          platforms: ['ios', 'android'],
          disableOnMobile: true, //Disabled due to pasting payment uri
        },
        {
          id: 'paytaca',
          name: 'Paytaca',
          image: '/assets/wallets/paytaca.png',
          protocols: ['bip70', 'jpp', 'wc2', 'jppv2'],
          networks: ['mainnet'],
          platforms: ['ios', 'android', 'chrome-extension'],
        },
        {
          id: 'flowee',
          name: 'Flowee Pay',
          image: '/assets/wallets/flowee.png',
          protocols: ['bip70'],
          networks: ['mainnet'],
          platforms: ['android'],
          disableOnMobile: true, //Disabled due to no testing
        },
        {
          id: 'edge',
          name: 'Edge',
          image: '/assets/wallets/edge.png',
          protocols: ['jppv2'],
          networks: ['mainnet'],
          platforms: ['ios', 'android'],
        },
      ],
      desktopWallets: [
        {
          id: 'electron_desktop',
          name: 'EC Desktop',
          image: '/assets/wallets/electroncash.png',
          protocols: ['bip70'],
          networks: ['mainnet', 'chipnet'],
        },
        {
          id: 'cashonize',
          name: 'Cashonize',
          image: '/assets/wallets/cashonize.png',
          protocols: ['wc2'],
          networks: ['mainnet', 'chipnet'],
          links: {
            native: 'https://cashonize.com',
            universal: () => 'https://cashonize.com/#/',
          },
        },
        {
          id: 'bitcoin_com',
          name: 'Bitcoin.com',
          image: '/assets/wallets/bitcoindotcom.png',
          protocols: ['bip70'],
          networks: ['mainnet'],
        },
        {
          id: 'paytaca',
          name: 'Paytaca',
          image: '/assets/wallets/paytaca.png',
          protocols: ['bip70', 'jpp', 'wc2', 'jppv2'],
          networks: ['mainnet'],
        },
        {
          id: 'flowee',
          name: 'Flowee Pay',
          image: '/assets/wallets/flowee.png',
          protocols: ['bip70'],
          networks: ['mainnet'],
        },
      ],
    }
  }, [])
}
