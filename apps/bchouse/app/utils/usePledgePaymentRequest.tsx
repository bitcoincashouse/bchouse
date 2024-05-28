import { $useLoaderQuery } from 'remix-query'

export function clearPaymentRequestQuery(params: {
  amount: number
  address: string
  campaignId: string
}) {
  return window.remixQueryClientUtils.invalidate(
    '/api/campaign/pledge/pay/:campaignId/:address/:amount',
    params
  )
}

export function queryPaymentRequest(params: {
  amount: number
  address: string
  campaignId: string
}) {
  return window.remixQueryClientUtils.fetch(
    '/api/campaign/pledge/pay/:campaignId/:address/:amount',
    params,
    {
      //Match expiration time
      staleTime: 15 * 60 * 1000,
    }
  )
}

export function usePaymentRequest(
  params: {
    amount: number
    address: string
    campaignId: string
  } | null
) {
  return $useLoaderQuery(
    '/api/campaign/pledge/pay/:campaignId/:address/:amount',
    {
      params: params as NonNullable<typeof params>,
      enabled: !!params,
      //Match expiration time
      staleTime: 15 * 60 * 1000,
      //If unloaded, do not use cache
      gcTime: 0,
    }
  )
}
