import { prettyPrintSats } from '@bchouse/utils'
import { LoaderFunctionArgs } from '@remix-run/node'
import { Link, useParams } from '@remix-run/react'
import { useMemo } from 'react'
import { z } from 'zod'
import { StandardLayout } from '~/components/layouts/standard-layout'
import { classnames } from '~/components/utils/classnames'
import { trpc } from '~/utils/trpc'
import { zx } from '~/utils/zodix'

export const loader = async (_: LoaderFunctionArgs) => {
  const { secret } = zx.parseParams(_.params, {
    secret: z.string(),
  })

  await _.context.trpc.campaign.getPledge.prefetch({ secret })
  return _.context.getDehydratedState()
}

export const handle = {
  title: 'Refund pledge',
}

export default function Page() {
  const { secret } = useParams<{ secret: string }>()

  const { data: pledge } = trpc.campaign.getPledge.useQuery(
    { secret: secret! },
    {
      staleTime: 5 * 60 * 1000,
      gcTime: 15 * 60 * 1000,
    }
  )

  const [amount, denomination] = useMemo(() => {
    return pledge
      ? prettyPrintSats(
          Number(
            pledge.forwardTx?.pledgedAmount.toString() ||
              pledge.satoshis.toString()
          )
        )
      : [0, 0]
  }, [pledge])

  const refundMutation = trpc.campaign.refundPledge.useMutation()
  const refundTxId = pledge?.refundTxId || refundMutation.data?.txid

  if (!pledge) return null

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
                pledge.fulfillmentTxId ? 'line-through' : ''
              )}
            >
              Refund address - {pledge.refundAddress}
            </p>
            {pledge.fulfillmentTxId ? (
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
                        pledge.network === 'chipnet' ? 'cbch' : 'bch'
                      }.loping.net/tx/` + refundTxId
                    }
                    className="rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                  >
                    Refunded - view on blockchain
                  </a>
                ) : (
                  <form
                    method="POST"
                    onSubmit={() => refundMutation.mutate({ secret: secret! })}
                  >
                    <button
                      type="submit"
                      disabled={!!pledge.fulfillmentTxId}
                      className="disabled:bg-gray-300 rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                    >
                      {refundMutation.status === 'pending'
                        ? 'Refunding...'
                        : 'Refund'}
                    </button>
                  </form>
                )}
                <Link
                  to={`/profile/${pledge.campaignOrganizer}/status/${pledge.postId}`}
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
