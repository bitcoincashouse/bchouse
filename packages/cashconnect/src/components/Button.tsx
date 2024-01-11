import React from 'react'
import { cn } from '~/utils/cn'
import { Text } from './Text'

export function WCButton({
  iconLeft,
  iconRight,
  variant = 'default',
  children,
  buttonClassName,
  ...props
}: {
  iconLeft?: React.ReactNode
  iconRight?: React.ReactNode
  buttonClassName?: string
  variant?: 'default' | 'ghost' | 'outline'
} & React.ComponentProps<'button'>) {
  const classes = {
    'wcm-icon-left': iconLeft !== undefined,
    'wcm-icon-right': iconRight !== undefined,
    'wcm-ghost': variant === 'ghost',
    'wcm-outline': variant === 'outline',
  }
  let textColor = 'inverse'
  if (variant === 'ghost') {
    textColor = 'secondary'
  }
  if (variant === 'outline') {
    textColor = 'accent'
  }

  return (
    <div className="wcm-button flex justify-center">
      <button
        {...props}
        className={cn('flex items-center', classes, buttonClassName)}
      >
        {iconLeft}
        <Text variant="small-regular" color={textColor} spanClassName="flex">
          {children}
        </Text>
        {iconRight}
      </button>
    </div>
  )
}
