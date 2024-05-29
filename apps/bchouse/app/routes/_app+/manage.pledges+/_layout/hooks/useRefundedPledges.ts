import { $useLoaderQuery } from 'remix-query'

export function useRefundedPledges() {
  return $useLoaderQuery('/api/campaign/pledge/list', {
    gcTime: 5 * 60 * 1000,
    staleTime: 1 * 60 * 1000,
    select(pledges) {
      return pledges?.filter((p) => !!p.refundTxId) || []
    },
  })
}
