import { trpc } from '~/utils/trpc'

export function clearPaymentRequestQuery(params: {
  amount: number
  address: string
  campaignId: string
}) {
  return window.trpcClientUtils.campaign.paymentRequestPledge.invalidate(params)
}

export function queryPaymentRequest(params: {
  amount: number
  address: string
  campaignId: string
}) {
  return window.trpcClientUtils.campaign.paymentRequestPledge.fetch(params, {
    //Match expiration time
    staleTime: 15 * 60 * 1000,
  })
}

export function usePaymentRequest(
  params: {
    amount: number
    address: string
    campaignId: string
  } | null
) {
  return trpc.campaign.paymentRequestPledge.useQuery(
    params as NonNullable<typeof params>,
    {
      enabled: !!params,
      //Match expiration time
      staleTime: 15 * 60 * 1000,
      //If unloaded, do not use cache
      gcTime: 0,
    }
  )
}
