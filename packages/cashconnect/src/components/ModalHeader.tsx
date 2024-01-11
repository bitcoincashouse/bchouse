import { cn } from '~/utils/cn'
import { SvgUtil } from '../utils/SvgUtil'
import { WCText } from './Text'

export function WCHeader({
  children,
  border,
  title,
  onAction,
  actionIcon,
  onGoBack,
  showBackBtn = false,
  className,
}: {
  title?: React.ReactNode
  onGoBack?: () => void
  showBackBtn?: boolean
  border?: boolean
  onAction?: () => void
  actionIcon?: React.ReactNode
} & Omit<React.ComponentProps<'div'>, 'title'>) {
  const classes = {
    'wcm-border': border,
  }

  const content = title ? (
    <WCText
      variant="big-bold"
      className="px-8 text-center overflow-hidden text-ellipsis"
    >
      {title}
    </WCText>
  ) : (
    children
  )

  return (
    <header className={cn('wcm-modal-header', classes, className)}>
      {showBackBtn && onGoBack ? (
        <button className="wcm-back-btn" onClick={onGoBack}>
          {SvgUtil.BACK_ICON}
        </button>
      ) : null}{' '}
      {content}
      {onAction ? (
        <button className="wcm-action-btn" onClick={onAction}>
          {actionIcon}
        </button>
      ) : null}
    </header>
  )
}
