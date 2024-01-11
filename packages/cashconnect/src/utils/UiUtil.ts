import { logger } from '~/utils/logger'
import { ConfigCtrl } from '../core/controllers/ConfigCtrl'
import { ExplorerCtrl } from '../core/controllers/ExplorerCtrl'
import { OptionsCtrl } from '../core/controllers/OptionsCtrl'
import { RouterCtrl } from '../core/controllers/RouterCtrl'
import { ToastCtrl } from '../core/controllers/ToastCtrl'
import { WalletData } from '../core/types/controllerTypes'
import { CoreUtil } from '../core/utils/CoreUtil'

export const UiUtil = {
  MOBILE_BREAKPOINT: 600,

  WCM_RECENT_WALLET_DATA: 'WCM_RECENT_WALLET_DATA',

  EXPLORER_WALLET_URL: 'https://explorer.walletconnect.com/?type=wallet',

  getWalletIcon({ id, image_id }: { id: string; image_id?: string }) {
    const { mobileWallets, desktopWallets } = ConfigCtrl.state
    const wallet =
      mobileWallets?.find((w) => w.id === id) ||
      desktopWallets?.find((w) => w.id === id)

    if (wallet?.image) {
      return wallet?.image
    } else if (image_id) {
      return ExplorerCtrl.getWalletImageUrl(image_id)
    }

    return ''
  },

  getWalletName(name: string, short = false) {
    return short && name.length > 8 ? `${name.substring(0, 8)}..` : name
  },

  isMobileAnimation() {
    if (typeof window === 'undefined') return false
    return window.innerWidth <= UiUtil.MOBILE_BREAKPOINT
  },

  async preloadImage(src: string) {
    const imagePromise = new Promise((resolve, reject) => {
      const image = new Image()
      image.onload = resolve
      image.onerror = reject
      image.crossOrigin = 'anonymous'
      image.src = src
    })

    return Promise.race([imagePromise, CoreUtil.wait(3_000)])
  },

  getErrorMessage(err: unknown) {
    return err instanceof Error ? err.message : 'Unknown Error'
  },

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  debounce(func: (...args: any[]) => unknown, timeout = 500) {
    let timer: NodeJS.Timeout | undefined = undefined

    return (...args: unknown[]) => {
      function next() {
        func(...args)
      }
      if (timer) {
        clearTimeout(timer)
      }
      timer = setTimeout(next, timeout)
    }
  },

  async handleMobileLinking(wallet: WalletData) {
    const { walletConnectUri } = OptionsCtrl.state
    const { mobile, name, disableLinkFormatting } = wallet
    const nativeUrl = mobile?.native
    const universalUrl = mobile?.universal
    const url = await CoreUtil.getWalletValue(nativeUrl || universalUrl)
    UiUtil.setRecentWallet(wallet)

    function onRedirect(uri: string) {
      let href = ''

      if (!url) return

      if (disableLinkFormatting) {
        href = url
      } else if (nativeUrl) {
        href = CoreUtil.formatUniversalUrl(url, uri, name)
      } else if (universalUrl) {
        href = CoreUtil.formatNativeUrl(url, uri, name)
      }
      CoreUtil.openHref(href, '_self')
    }

    if (walletConnectUri) {
      onRedirect(walletConnectUri)
    }
  },

  handleAndroidLinking() {
    const { walletConnectUri } = OptionsCtrl.state

    if (walletConnectUri) {
      CoreUtil.setWalletConnectAndroidDeepLink(walletConnectUri)
      CoreUtil.openHref(walletConnectUri, '_self')
    }
  },

  async handleUriCopy(uri?: string) {
    if (uri) {
      try {
        await navigator.clipboard.writeText(uri)
        ToastCtrl.openToast('Link copied', 'success')
      } catch (err) {
        logger.error(err)
        ToastCtrl.openToast('Failed to copy', 'error')
      }
    }
  },

  getCustomImageUrls() {
    const { mobileWallets, desktopWallets } = ConfigCtrl.state
    const walletImageUrls = mobileWallets
      ?.map((w) => w.image)
      .concat(desktopWallets?.map((w) => w.image))
      .filter(Boolean)

    return walletImageUrls
  },

  truncate(value: string, strLen = 8) {
    if (value.length <= strLen) {
      return value
    }

    return `${value.substring(0, 4)}...${value.substring(value.length - 4)}`
  },

  setRecentWallet(wallet: WalletData) {
    if (ConfigCtrl.state.disableRecentWallets) {
      return
    }

    try {
      localStorage.setItem(
        UiUtil.WCM_RECENT_WALLET_DATA,
        JSON.stringify(wallet)
      )
    } catch {
      logger.info('Unable to set recent wallet')
    }
  },

  getRecentWallet() {
    if (ConfigCtrl.state.disableRecentWallets) {
      return
    }

    try {
      const wallet = localStorage.getItem(UiUtil.WCM_RECENT_WALLET_DATA)
      if (wallet) {
        const json = JSON.parse(wallet)

        return json as WalletData
      }

      return undefined
    } catch {
      logger.info('Unable to get recent wallet')
    }

    return undefined
  },

  caseSafeIncludes(str1: string, str2: string) {
    return str1.toUpperCase().includes(str2.toUpperCase())
  },

  openWalletExplorerUrl() {
    CoreUtil.openHref(UiUtil.EXPLORER_WALLET_URL, '_blank')
  },

  getCachedRouterWalletPlatforms() {
    const { desktop, mobile } = CoreUtil.getWalletRouterData()
    const isDesktop = Boolean(desktop?.native)
    const isWeb = Boolean(desktop?.universal)
    const isMobile = Boolean(mobile?.native) || Boolean(mobile?.universal)

    return { isDesktop, isMobile, isWeb }
  },

  goToConnectingView(wallet: WalletData) {
    RouterCtrl.setData({ Wallet: wallet })
    const isMobileDevice = CoreUtil.isMobile()
    const { isDesktop, isWeb, isMobile } =
      UiUtil.getCachedRouterWalletPlatforms()

    // Mobile
    if (isMobileDevice) {
      if (isMobile) {
        RouterCtrl.push('MobileConnecting')
      } else if (isWeb) {
        RouterCtrl.push('WebConnecting')
      } else {
        RouterCtrl.push('InstallWallet')
      }
    }

    // Desktop
    else if (isDesktop) {
      RouterCtrl.push('DesktopConnecting')
    } else if (isWeb) {
      RouterCtrl.push('WebConnecting')
    } else if (isMobile) {
      RouterCtrl.push('MobileQrcodeConnecting')
    } else {
      RouterCtrl.push('InstallWallet')
    }
  },
}
