import { cn } from '~/utils/cn'

export function Spinner({ className }: { className?: string }) {
  return (
    <div className={cn('wcm-spinner', className)}>
      <svg viewBox="0 0 50 50" width="24" height="24">
        <circle
          cx="25"
          cy="25"
          r="20"
          fill="none"
          strokeWidth="4"
          stroke="#fff"
        />
      </svg>
    </div>
  )
}
