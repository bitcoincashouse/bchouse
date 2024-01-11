import { InformationCircleIcon, XMarkIcon } from '@heroicons/react/20/solid'
import { classNames } from '../utils/classNames'

export default function InfoAlert({
  children,
  className,
  ...props
}: React.DetailedHTMLProps<
  React.AnchorHTMLAttributes<HTMLAnchorElement>,
  HTMLAnchorElement
> & {
  onDismiss?: () => void
}) {
  return (
    <div className={classNames(className, 'rounded-md bg-blue-50 p-4')}>
      <div className="flex">
        <div className="flex-shrink-0">
          <InformationCircleIcon
            className="h-5 w-5 text-blue-400"
            aria-hidden="true"
          />
        </div>
        <div className="ml-3 flex-1 md:flex md:justify-between">
          <p className="text-sm text-blue-700 lg:text-center flex-1">
            {children}
          </p>
          <p className="mt-3 text-sm md:ml-6 md:mt-0">
            {!!props.href ? (
              <a
                href={props.href}
                className="whitespace-nowrap font-medium text-blue-700 hover:text-blue-600"
                {...props}
              >
                Details
                <span aria-hidden="true"> &rarr;</span>
              </a>
            ) : !!props.onDismiss ? (
              <button
                type="button"
                onClick={props.onDismiss}
                className="whitespace-nowrap font-medium text-blue-700 hover:text-blue-600 text-right"
              >
                Do not show again
                <XMarkIcon className="hidden md:inline-block w-5 h-5" />
              </button>
            ) : null}
          </p>
        </div>
      </div>
    </div>
  )
}
