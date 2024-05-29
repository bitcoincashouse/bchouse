import { moment } from '@bchouse/utils'
import { Link } from '@remix-run/react'
import { Message } from '~/components/message'
import { classnames } from '~/components/utils/classnames'

export function Grid({
  codes,
}: {
  codes: {
    code: string
    claimedEmailAddress: string | null
    createdAt: Date
  }[]
}) {
  return (
    <div>
      <ul
        role="list"
        className="mt-3 flex flex-col gap-2 h-96 overflow-y-auto overflow-x-hidden"
      >
        {!codes.length ? (
          <div className="h-full w-full flex items-center justify-center">
            <Message
              message="No codes generated"
              actionMessage=""
              className="p-0"
            />
          </div>
        ) : null}

        {codes.map((code) => (
          <li key={code.code} className="flex rounded-md shadow-sm pr-4">
            <div
              className={classnames(
                'text-center flex bg-indigo-200 dark:bg-indigo-900 w-1/4 max-w-40 flex-shrink-0 items-center justify-center rounded-l-md text-sm font-medium text-primary-text'
              )}
            >
              {moment(code.createdAt).fromNow()}
            </div>
            <div className="flex flex-grow items-center justify-between truncate rounded-r-md border-b border-r border-t border-gray-300 dark:border-gray-700 bg-secondary">
              <div className="flex-1 truncate px-4 py-2 text-sm">
                <Link
                  to={'./claim/' + code.code}
                  relative="path"
                  className="font-medium text-primary-text hover:text-gray-600"
                >
                  {code.code}
                </Link>
                <p className="text-secondary-text truncate">
                  {code.claimedEmailAddress ? (
                    <>
                      Claimed by{' '}
                      <span title={code.claimedEmailAddress}>
                        {code.claimedEmailAddress}
                      </span>
                    </>
                  ) : (
                    'Unclaimed'
                  )}
                </p>
              </div>
              {/* <div className="flex-shrink-0 pr-2">
                  <button
                    type="button"
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-transparent bg-secondary text-secondary-text hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                  >
                    <span className="sr-only">Open options</span>
                    <EllipsisVerticalIcon
                      className="h-5 w-5"
                      aria-hidden="true"
                    />
                  </button>
                </div> */}
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
