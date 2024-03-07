import { z } from 'zod'

export function submitAnyonecanpayPledge(params: {
  campaignId: string
  payload: string
}) {
  //TODO: trpc.submitAnyonecanpay
  return fetch('/api/campaign/' + params.campaignId + '/anyonecanpay/submit', {
    method: 'POST',
    body: JSON.stringify({
      payload: params.payload,
    }),
  })
    .then((res) => {
      return res.json().then((json) =>
        z
          .object({
            pledgeId: z.string(),
          })
          .parse(json)
      )
    })
    .catch(() => {
      return new Error('Error submitting pledge')
    })
}
