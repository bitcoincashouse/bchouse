import { cn } from '~/utils/cn'

export function InfoFooter({
  children,
  className,
}: React.ComponentProps<'div'>) {
  return (
    <div className={cn('wcm-info-footer', className)}>
      <div>{children}</div>
    </div>
  )
}
