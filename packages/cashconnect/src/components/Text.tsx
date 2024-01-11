import { cn } from '~/utils/cn'

type Variant =
  | 'big-bold'
  | 'medium-regular'
  | 'small-regular'
  | 'small-thin'
  | 'xsmall-bold'
  | 'xsmall-regular'

type Color =
  | 'accent'
  | 'error'
  | 'inverse'
  | 'primary'
  | 'secondary'
  | 'tertiary'

export function Text({
  variant = 'medium-regular',
  color = 'primary',
  children,
  spanClassName,
  ...props
}: {
  variant?: Variant
  color?: Color | string
  spanClassName?: string
} & React.ComponentProps<'span'>) {
  const classes = {
    'wcm-big-bold': variant === 'big-bold',
    'wcm-medium-regular': variant === 'medium-regular',
    'wcm-small-regular': variant === 'small-regular',
    'wcm-small-thin': variant === 'small-thin',
    'wcm-xsmall-regular': variant === 'xsmall-regular',
    'wcm-xsmall-bold': variant === 'xsmall-bold',
    'wcm-color-primary': color === 'primary',
    'wcm-color-secondary': color === 'secondary',
    'wcm-color-tertiary': color === 'tertiary',
    'wcm-color-inverse': color === 'inverse',
    'wcm-color-accnt': color === 'accent',
    'wcm-color-error': color === 'error',
    'wcm-color-success': color === 'success',
  }

  return (
    <div className={cn(props.className, 'wcm-text')}>
      <span className={cn(spanClassName)}>
        <span {...props} className={cn(classes)}>
          {children}
        </span>
      </span>
    </div>
  )
}

export const WCText = Text
