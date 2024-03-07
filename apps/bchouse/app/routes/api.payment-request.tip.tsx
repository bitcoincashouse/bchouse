import { trpc } from '~/utils/trpc'

export function clearTipPaymentRequestQuery(params: {
  postId: string
  amount: number
}) {
  return window.trpcClientUtils.paymentRequestTip.invalidate(params)
}

export function queryTipPaymentRequest(params: {
  postId: string
  amount: number
}) {
  return window.trpcClientUtils.paymentRequestTip.fetch(params, {
    //Match expiration time
    staleTime: 15 * 60 * 1000,
  })
}

export function useTipPaymentRequest(
  params: {
    postId: string
    amount: number
  } | null
) {
  return trpc.paymentRequestTip.useQuery(params as NonNullable<typeof params>, {
    enabled: !!params,
    //Match expiration time
    staleTime: 15 * 60 * 1000,
    //If unloaded, do not use cache
    gcTime: 0,
  })
}
