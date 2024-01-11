import { useMemo } from 'react'
import { cn } from '~/utils/cn'
import { ThemeCtrl } from '../core/controllers/ThemeCtrl'
import { WalletData } from '../core/types/controllerTypes'
import { QrCodeUtil } from '../utils/QrCode'
import { SvgUtil } from '../utils/SvgUtil'
import { WalletImage } from './WalletImage'

export function QrCode({
  uri = '',
  size = 0,
  wallet,
}: {
  uri?: string
  size?: number
  wallet?: WalletData
}) {
  // -- state & properties ------------------------------------------- //

  // -- private ------------------------------------------------------ //
  const isLightMode = ThemeCtrl.state.themeMode === 'light'
  const svgTemplate = useMemo(() => {
    const _size = Math.max(0, isLightMode ? size : size - 18 * 2)

    return (
      <svg
        height={_size}
        width={_size}
        dangerouslySetInnerHTML={{
          __html: QrCodeUtil.generate(uri, _size, _size / 4),
        }}
      ></svg>
    )
  }, [isLightMode, size, uri])

  const classes = {
    'wcm-dark': ThemeCtrl.state.themeMode === 'dark',
  }

  return (
    <div style={{ width: `${size}px` }} className={cn('wcm-qrcode', classes)}>
      {wallet ? (
        <WalletImage wallet={wallet}></WalletImage>
      ) : (
        SvgUtil.WALLET_CONNECT_ICON_COLORED
      )}
      {svgTemplate}
    </div>
  )
}
