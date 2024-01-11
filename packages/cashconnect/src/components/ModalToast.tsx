import { useEffect, useState } from 'react'
import { cn } from '~/utils/cn'
import { ToastCtrl } from '../core/controllers/ToastCtrl'
import { SvgUtil } from '../utils/SvgUtil'
import { Text } from './Text'

export function Toast() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    let timeout: NodeJS.Timeout

    const unsubscribe = ToastCtrl.subscribe((newState) => {
      if (newState.open) {
        setOpen(true)
        timeout = setTimeout(() => ToastCtrl.closeToast(), 2200)
      } else {
        setOpen(false)
        clearTimeout(timeout)
      }
    })

    return () => {
      unsubscribe?.()
      clearTimeout(timeout)
      ToastCtrl.closeToast()
    }
  }, [])

  const { message, variant } = ToastCtrl.state
  const classes = {
    'wcm-success': variant === 'success',
    'wcm-error': variant === 'error',
  }

  return open ? (
    <div className={cn('wcm-modal-toast', classes)}>
      {variant === 'success' ? SvgUtil.CHECKMARK_ICON : null}
      {variant === 'error' ? SvgUtil.CROSS_ICON : null}
      <Text variant="small-regular">{message}</Text>
    </div>
  ) : null
}
