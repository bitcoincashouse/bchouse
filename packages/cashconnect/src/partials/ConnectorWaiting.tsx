import { cn } from '~/utils/cn'
import { WCText } from '../components/Text'
import { WalletImage } from '../components/WalletImage'
import { ThemeCtrl } from '../core/controllers/ThemeCtrl'
import { WalletData } from '../core/types/controllerTypes'
import { ThemeUtil } from '../utils/ThemeUtil'

export function ConnectorWaiting({
  wallet,
  isError = false,
  isStale = false,
  label = '',
}: {
  wallet: WalletData
  isError?: boolean
  isStale?: boolean
  label?: string
}) {
  function svgLoaderTemplate() {
    const ICON_SIZE = 88
    const DH_ARRAY = 317
    const DH_OFFSET = 425

    const radius =
      ThemeCtrl.state.themeVariables?.[
        '--wcm-wallet-icon-large-border-radius'
      ] ?? ThemeUtil.getPreset('--wcm-wallet-icon-large-border-radius')
    let numRadius = 0

    if (radius.includes('%')) {
      numRadius = (ICON_SIZE / 100) * parseInt(radius, 10)
    } else {
      numRadius = parseInt(radius, 10)
    }

    numRadius *= 1.17
    const dashArray = DH_ARRAY - numRadius * 1.57
    const dashOffset = DH_OFFSET - numRadius * 1.8

    return (
      <svg viewBox="0 0 110 110" width="110" height="110">
        <rect
          id="wcm-loader"
          x="2"
          y="2"
          width="106"
          height="106"
          rx={numRadius}
        />
        <use
          xlinkHref="#wcm-loader"
          strokeDasharray={`106 ${dashArray}`}
          strokeDashoffset={dashOffset}
        ></use>
      </svg>
    )
  }

  const classes = {
    'wcm-error': isError,
    'wcm-stale': isStale,
  }

  return (
    <div className="wcm-connector-waiting">
      <div className={cn('loader', classes)}>
        {svgLoaderTemplate()}
        <WalletImage wallet={wallet}></WalletImage>
      </div>
      <WCText variant="medium-regular" color={isError ? 'error' : 'primary'}>
        {isError ? 'Connection declined' : label}
      </WCText>
    </div>
  )
}
