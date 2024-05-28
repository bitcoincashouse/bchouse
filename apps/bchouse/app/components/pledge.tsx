import { prettyPrintSats } from '@bchouse/utils'
import { Link } from '@remix-run/react'
import { useMemo } from 'react'
import { $useActionMutation, Routes } from 'remix-query'
import { classnames } from '~/components/utils/classnames'

type Pledge = Routes['/api/campaign/pledge/list']['loaderResult'][number]
export function Pledge({ pledge }: { pledge: Pledge }) {
  const [amount, denomination] = useMemo(() => {
    return prettyPrintSats(
      Number(
        pledge.forwardTx?.pledgedAmount.toString() || pledge.satoshis.toString()
      )
    )
  }, [pledge])

  const {
    mutate: refundPledgeMutation,
    error,
    isPending,
    data,
  } = $useActionMutation('/api/campaign/pledge/refund')

  if (error) {
    //TODO: Show a modal
  }

  const refundTxId = pledge.refundTxId || data?.txid

  return (
    <li key={pledge.pledgeRequestId}>
      <div className="flex flex-row items-center hover:bg-hover transition-all ease-in-out duration-300 cursor-pointer pl-2">
        <div className={classnames('w-2 h-2 rounded-full')}></div>
        <div className="flex flex-col gap-8 px-4 py-4 truncate">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex flex-col gap-4 truncate flex-1">
              <div>
                <p className="text-sm font-semibold text-primary-text">
                  Pledge Amount: {amount} {denomination}
                </p>
                <p
                  className={classnames(
                    'mt-2 text-sm leading-7 text-secondary-text truncate',
                    pledge.fulfillmentTxId ? 'line-through' : ''
                  )}
                >
                  Refund address - {pledge.refundAddress}
                </p>
              </div>
            </div>
            <div className="flex sm:ml-auto flex-shrink-0 items-center gap-x-6">
              {refundTxId ? (
                <button
                  type="button"
                  disabled
                  className="disabled:bg-gray-300 dark:disabled:bg-gray-700 rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white disabled:text-secondary-text shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                >
                  Refunded
                </button>
              ) : (
                <form
                  method="POST"
                  onSubmit={() =>
                    refundPledgeMutation({
                      secret: pledge.secret,
                    })
                  }
                >
                  <button
                    type="submit"
                    disabled={!!pledge.fulfillmentTxId}
                    className="disabled:bg-gray-300 dark:disabled:bg-gray-700 rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white disabled:text-secondary-text shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                  >
                    {!!pledge.fulfillmentTxId
                      ? 'Fulfilled'
                      : isPending
                      ? 'Refunding...'
                      : 'Refund'}
                  </button>
                </form>
              )}
            </div>
          </div>
          <div className="flex flex-row flex-wrap justify-between gap-2">
            <Link
              to={`/profile/${pledge.campaignOrganizer}/status/${pledge.postId}`}
              className="text-sm font-semibold text-primary-text"
            >
              <span aria-hidden="true">&larr;</span> View campaign
            </Link>
            <a
              target="_blank"
              href={
                `https://${
                  pledge.network === 'chipnet' ? 'cbch' : 'bch'
                }.loping.net/tx/` +
                (refundTxId ||
                  pledge.fulfillmentTxId ||
                  pledge.forwardTx?.txid ||
                  pledge.txid)
              }
              className="text-sm font-semibold text-primary-text"
            >
              View on blockchain <span aria-hidden="true">&rarr;</span>
            </a>
          </div>
        </div>
      </div>
    </li>
  )
}
