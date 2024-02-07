import { ActionArgs, json } from '@remix-run/node'
import { useQuery } from '@tanstack/react-query'
import { z } from 'zod'
import { logger } from '~/utils/logger'

export const action = async (_: ActionArgs) => {
  await _.context.ratelimit.limitByIp(_, 'api', true)

  const { userId } = await _.context.authService.getAuthOptional(_)
  const formData = await _.request.json()

  const { amount, postId } = z
    .object({
      amount: z.coerce.bigint(),
      postId: z.string(),
    })
    .parse(formData)

  const { paymentUrl, invoiceId } =
    await _.context.postService.createTipInvoice({
      postId,
      userId,
      amount,
      paygateUrl: _.context.paygateUrl,
    })

  return json({
    paymentUrl,
    requestId: invoiceId,
  })
}

export async function fetchTipPaymentRequest(params: {
  postId: string
  amount: number
}) {
  return await fetch(
    '/api/payment-request/tip?_data=routes/api.payment-request.tip',
    {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params as NonNullable<typeof params>),
    }
  )
    .then((response) => {
      if (response.ok) {
        return response.json()
      }

      logger.error('Error fetching payment request', response.statusText)
      throw new Error('Error occurred')
    })
    .then((data) =>
      z
        .object({
          paymentUrl: z.string(),
          requestId: z.string(),
        })
        .parse(data)
    )
}

export function clearTipPaymentRequestQuery(params: {
  postId: string
  amount: number
}) {
  const queryClient = window.queryClient

  return queryClient.invalidateQueries({
    queryKey: ['tipPaymentRequest', params],
  })
}

export function queryTipPaymentRequest(params: {
  postId: string
  amount: number
}) {
  const queryClient = window.queryClient

  return queryClient.fetchQuery(
    ['tipPaymentRequest', params],
    () => fetchTipPaymentRequest(params),
    {
      //Match expiration time
      staleTime: 15 * 60 * 1000,
    }
  )
}

export function useTipPaymentRequest(
  params: {
    postId: string
    amount: number
  } | null
) {
  return useQuery(
    ['tipPaymentRequest', params],
    async () => fetchTipPaymentRequest(params as NonNullable<typeof params>),
    {
      enabled: !!params && !!params.amount && !!params.postId,
      //Match expiration time
      staleTime: 15 * 60 * 1000,
      //If unloaded, do not use cache
      cacheTime: 0,
    }
  )
}
