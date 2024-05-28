import { $useLoaderQuery } from 'remix-query'

export function clearTipPaymentRequestQuery(params: {
  postId: string
  amount: number
}) {
  return window.remixQueryClientUtils.invalidate(
    '/api/post/tip/:postId/:amount',
    params
  )
}

export function queryTipPaymentRequest(params: {
  postId: string
  amount: number
}) {
  return window.remixQueryClientUtils.fetch(
    '/api/post/tip/:postId/:amount',
    params,
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
  return $useLoaderQuery('/api/post/tip/:postId/:amount', {
    params: params as NonNullable<typeof params>,
    enabled: !!params,
    //Match expiration time
    staleTime: 15 * 60 * 1000,
    //If unloaded, do not use cache
    gcTime: 0,
  })
}
