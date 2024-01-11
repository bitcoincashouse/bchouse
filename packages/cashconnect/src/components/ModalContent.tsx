import { cn } from '~/utils/cn'

export function Content({
  children,
  className,
  mainClassName,
}: React.ComponentProps<'div'> & { mainClassName?: string }) {
  return (
    <div className={cn('wcm-modal-content', className)}>
      <main className={cn(mainClassName)}>{children}</main>
    </div>
  )
}
