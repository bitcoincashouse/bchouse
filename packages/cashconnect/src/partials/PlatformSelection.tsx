import { WCButton } from '../components/Button'
import { RouterCtrl } from '../core/controllers/RouterCtrl'
import { SvgUtil } from '../utils/SvgUtil'

export function PlatformSelection({
  isMobile = false,
  isDesktop = false,
  isWeb = false,
  isRetry = false,
  children = null as React.ReactNode,
}) {
  function onMobile() {
    if (isMobile) {
      RouterCtrl.replace('MobileConnecting')
    } else {
      RouterCtrl.replace('MobileQrcodeConnecting')
    }
  }

  function onDesktop() {
    RouterCtrl.replace('DesktopConnecting')
  }

  function onWeb() {
    RouterCtrl.replace('WebConnecting')
  }

  return (
    <div className="wcm-platform-selection">
      <div>
        <div>
          {isRetry ? children : null}
          {isMobile ? (
            <WCButton
              onClick={onMobile}
              iconLeft={SvgUtil.MOBILE_ICON}
              variant="outline"
            >
              Mobile
            </WCButton>
          ) : null}
          {isDesktop ? (
            <WCButton
              onClick={onDesktop}
              iconLeft={SvgUtil.DESKTOP_ICON}
              variant="outline"
            >
              Desktop
            </WCButton>
          ) : null}
          {isWeb ? (
            <WCButton
              onClick={onWeb}
              iconLeft={SvgUtil.GLOBE_ICON}
              variant="outline"
            >
              Web
            </WCButton>
          ) : null}
        </div>
      </div>
    </div>
  )
}
