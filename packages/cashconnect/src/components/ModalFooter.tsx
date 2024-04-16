import { cn } from '~/utils/cn'

export function Footer({
  className,
  children,
}: React.ComponentProps<'div'> & { className?: string }) {
  return (
    <footer className={cn('wcm-modal-footer', className)}>{children}</footer>
  )
}
