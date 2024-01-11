import { SvgUtil } from '../utils/SvgUtil'

export function Backcard({ onClose }: { onClose: () => void | Promise<void> }) {
  return (
    <div className="wcm-modal-backcard">
      <div className="wcm-toolbar-placeholder"></div>
      <div className="wcm-toolbar">
        {SvgUtil.WALLET_CONNECT_LOGO}
        <button type="button" onClick={onClose}>
          {SvgUtil.CROSS_ICON}
        </button>
      </div>
    </div>
  )
}
