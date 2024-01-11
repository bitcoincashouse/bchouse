import { classnames } from '../utils/classnames'

export function TimelineMessage({
  message,
  actionMessage,
  className,
}: {
  className?: string
  message: React.ReactNode
  actionMessage: React.ReactNode
}) {
  return (
    <div
      className={classnames(
        'flex flex-col items-center justify-center p-4 pt-8 gap-2',
        className
      )}
    >
      <h2 className="text-xl font-semibold text-secondary-text">{message}</h2>
      {<span className="text-gray-400">{actionMessage}</span>}
    </div>
  )
}
