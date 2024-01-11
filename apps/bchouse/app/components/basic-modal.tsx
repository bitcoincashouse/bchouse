import ReactDOM from 'react-dom'
import { ClientOnly } from './client-only.js'
import { classnames } from './utils/classnames.js'

export function BasicModal({
  onClose,
  open,
  children,
}: {
  open: boolean
  onClose: () => void
  children: React.ReactNode
}) {
  return open ? (
    <ClientOnly>
      {() =>
        ReactDOM.createPortal(
          <div>
            <div>
              <div
                onClick={onClose}
                className={classnames(
                  'bg-gray-600/20 absolute inset-0 w-screen h-screen'
                )}
              ></div>
              <div className="max-w-2xl m-auto absolute inset-0">
                <div className=" w-full h-full p-12">
                  <div className="bg-white w-full h-full rounded-xl flex flex-col">
                    <div className="flex justify-between items-center p-6">
                      {children}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>,
          document.querySelector('body') as HTMLElement
        )
      }
    </ClientOnly>
  ) : null
}
