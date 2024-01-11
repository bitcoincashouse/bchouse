import { Dialog, Transition } from '@headlessui/react'
import { VariantProps, cva } from 'class-variance-authority'
import { Fragment } from 'react'
import { classnames } from './utils/classnames'

export const modalVariants = cva(
  'relative transform text-left sm:py-8 px-.5 w-full',
  {
    variants: {
      variant: {
        default: '',
      },
      size: {
        default: 'sm:max-w-2xl',
        small: 'sm:max-w-xl',
      },
      fullScreen: {
        true: 'h-screen [&>div]:h-full',
      },
      transition: {
        all: 'transition-all',
        none: 'transition-none',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
      transition: 'all',
    },
  }
)

export const titleVariants = cva('leading-6 text-primary-text p-4', {
  variants: {
    size: {
      lg: 'text-lg',
      xl: 'text-xl',
      '2xl': 'text-2xl',
    },
    font: {
      bold: 'font-bold',
      semibold: 'font-semibold',
    },
  },
  defaultVariants: {
    size: 'xl',
    font: 'bold',
  },
})

export function Modal({
  onClose,
  open,
  children,
  title,
  action,
  onAction = () => {},
  className,
  size,
  variant,
  titleSize,
  titleFont,
  transition,
  fullScreen,
}: {
  title?: string
  action?: string
  onAction?: () => void
  open: boolean
  onClose: () => void
  children: React.ReactNode
  className?: string
  titleSize?: VariantProps<typeof titleVariants>['size']
  titleFont?: VariantProps<typeof titleVariants>['font']
} & VariantProps<typeof modalVariants>) {
  return (
    <Transition.Root appear show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full justify-center p-4 text-center items-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel
                className={classnames(
                  modalVariants({ size, variant, transition, fullScreen })
                )}
              >
                <div className="bg-primary rounded-lg">
                  {title || action ? (
                    <div className="flex justify-between items-center p-2">
                      {title ? (
                        <div className="mr-auto">
                          <Dialog.Title
                            as="h3"
                            className={classnames(
                              titleVariants({
                                size: titleSize,
                                font: titleFont,
                              })
                            )}
                          >
                            {title}
                          </Dialog.Title>
                        </div>
                      ) : null}
                      {action ? (
                        <div
                          className="p-2 bg-gray-800/90 hover:bg-gray-700/80 text-white rounded-full cursor-pointer"
                          title={action}
                          onClick={onAction}
                        >
                          <span className="text-base font-bold px-2">
                            {action}
                          </span>
                        </div>
                      ) : null}
                    </div>
                  ) : null}

                  <div className={className}>{children}</div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  )
}
