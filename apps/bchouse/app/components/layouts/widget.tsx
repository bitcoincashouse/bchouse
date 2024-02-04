import { classnames } from '../utils/classnames'

export function Widget<T>({
  title,
  items,
  keyProp,
  render,
  emptyMessage = 'No results',
  children,
  isLoading,
  isLoadingMessage = 'Loading...',
  className,
  listClassName,
  itemClassName,
}: {
  title: string
  items: T[]
  keyProp: keyof T | ((item: T) => string)
  render: (item: T, isEmpty?: boolean) => React.ReactNode
  children?: React.ReactNode
  emptyMessage?: string
  isLoading?: boolean
  isLoadingMessage?: string
  className?: string
  listClassName?: string
  itemClassName?: string
}) {
  const getKey =
    typeof keyProp === 'function'
      ? keyProp
      : (item: T) => item[keyProp] as React.Key

  return (
    <section aria-labelledby="announcements-title">
      <div
        className={classnames(
          className,
          'overflow-hidden rounded-lg bg-gray-50 bg-secondary'
        )}
      >
        <div className="my-2">
          <h2
            className="text-lg font-bold text-primary-text px-4"
            id="announcements-title"
          >
            {title}
          </h2>
          <div className="mt-6 flow-root">
            {items.length ? (
              <ul
                role="list"
                className={classnames(
                  '-my-5 divide-y divide-gray-200 px-6',
                  listClassName
                )}
              >
                {items.map((item) => (
                  <li
                    key={getKey(item)}
                    className={classnames('py-4', itemClassName)}
                  >
                    {render(item)}
                  </li>
                ))}
              </ul>
            ) : isLoading ? (
              <div>
                <p className="italic text-center text-secondary-text">
                  <>{isLoadingMessage}</>
                </p>
              </div>
            ) : (
              <div>
                <p className="italic text-center text-secondary-text">
                  <>{emptyMessage}</>
                </p>
              </div>
            )}

            {children}
          </div>
        </div>
      </div>
    </section>
  )
}

export function BoxWidget({
  title,
  children,
}: {
  title: string
  children?: React.ReactNode
}) {
  return (
    <section aria-labelledby="announcements-title">
      <div className="overflow-hidden rounded-lg bg-secondary pt-2 pb-3">
        <div className="">
          <h2
            className="text-lg font-bold text-primary-text px-4"
            id="announcements-title"
          >
            {title}
          </h2>
          <div className="px-6">
            <div className="">{children}</div>
          </div>
        </div>
      </div>
    </section>
  )
}
