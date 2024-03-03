import { prettyPrintSats } from '@bchouse/utils'
import { ActionFunctionArgs, LoaderFunctionArgs } from '@remix-run/node'
import { Link } from '@remix-run/react'
import { useMemo } from 'react'
import { typedjson, useTypedFetcher, useTypedLoaderData } from 'remix-typedjson'
import { z } from 'zod'
import { StandardLayout } from '~/components/layouts/standard-layout'
import { classnames } from '~/components/utils/classnames'
import { zx } from '~/utils/zodix'

export const loader = async (_: LoaderFunctionArgs) => {
  const { secret } = zx.parseParams(_.params, {
    secret: z.string(),
  })

  const result = await _.context.pledgeService.getPledgeBySecret({ secret })
  return typedjson(result)
}

export const action = async (_: ActionFunctionArgs) => {
  const { secret } = zx.parseParams(_.params, {
    secret: z.string(),
  })

  const result = await _.context.pledgeService.cancelPledge({ secret })
  return typedjson(result)
}

export const handle = {
  title: 'Refund pledge',
}

export default function Page() {
  const request = useTypedLoaderData<typeof loader>()
  const [amount, denomination] = useMemo(() => {
    return prettyPrintSats(
      Number(
        request.forwardTx?.pledgedAmount.toString() ||
          request.satoshis.toString()
      )
    )
  }, [request])

  const fetcher = useTypedFetcher<typeof action>()

  const refundTxId = request.refundTxId || fetcher.data?.txid

  return (
    <StandardLayout
      title={'Refund pledge'}
      hideSearch={true}
      main={
        <>
          <div className="grid min-h-full place-items-center px-6 py-24 sm:py-32 lg:px-8">
            <p className="text-sm font-semibold text-primary-text">
              Pledge Amount: {amount} {denomination}
            </p>
            <p
              className={classnames(
                'mt-2 text-sm leading-7 text-secondary-text',
                request.fulfillmentTxId ? 'line-through' : ''
              )}
            >
              Refund address - {request.refundAddress}
            </p>
            {request.fulfillmentTxId ? (
              <p
                className={classnames(
                  'mt-2 text-sm leading-7 text-secondary-text'
                )}
              >
                Campaign already completed
              </p>
            ) : null}

            <div className="text-center">
              <div className="mt-10 flex items-center justify-center gap-x-6">
                {refundTxId ? (
                  <a
                    target="_blank"
                    href={
                      `https://${
                        request.network === 'chipnet' ? 'cbch' : 'bch'
                      }.loping.net/tx/` + refundTxId
                    }
                    className="rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                  >
                    Refunded - view on blockchain
                  </a>
                ) : (
                  <fetcher.Form method="POST">
                    <button
                      type="submit"
                      disabled={!!request.fulfillmentTxId}
                      className="disabled:bg-gray-300 rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                    >
                      {fetcher.state === 'submitting'
                        ? 'Refunding...'
                        : 'Refund'}
                    </button>
                  </fetcher.Form>
                )}
                <Link
                  to={`/profile/${request.campaignOrganizer}/status/${request.postId}`}
                  className="text-sm font-semibold text-primary-text"
                >
                  View campaign <span aria-hidden="true">&rarr;</span>
                </Link>
              </div>
            </div>
          </div>
        </>
      }
    />
  )
}
