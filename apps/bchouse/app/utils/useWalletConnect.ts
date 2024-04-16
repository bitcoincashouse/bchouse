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
        {
          id: 'cashonize',
          name: 'Cashonize',
          image: '/assets/wallets/cashonize.png',
          protocols: ['wc2'],
          networks: ['mainnet', 'chipnet'],
          platforms: ['web'],
          links: {
            native: 'https://cashonize.com',
            universal: (wcUri?: string) => {
              if (wcUri) {
                //https://cashonize.com/#/wc?uri=wc%3Abed5e35b245bb3c1e2f29f1ea311ce493cbbca80c7fac8fdddb1ad867b09eb91%402%3Frelay-protocol%3Dirn%26symKey%3Dd6097b4a2fb593b897a63c450bf36df8223126bfa6ea3f36c7350ccb2914a0cd
                //https://cashonize.com/#/wc?uri=wc:028b693112f700dc4544e2e64c35d3a0128f9f072a6a0a6e4d0bd1c34efaacc4@2?expiryTimestamp=1713069157&relay-protocol=irn&symKey=f759a6d4bd21e36abd0d656338be7d41f0c601cde987afc4fad712046feb7667
                return (
                  'https://cashonize.com/#/wc?uri=' + encodeURIComponent(wcUri)
                )
              } else {
                return 'https://cashonize.com/#/'
              }
            },
          },
        },
      ],
    }
  }, [])
}
