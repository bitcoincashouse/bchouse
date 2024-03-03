import { LoaderFunctionArgs } from '@remix-run/node'
import { typedjson } from 'remix-typedjson'
import { z } from 'zod'
import { zx } from '~/utils/zodix'

export const action = async (_: LoaderFunctionArgs) => {
  await _.context.ratelimit.limitByIp(_, 'api', true)

  const { userId } = await _.context.authService.getAuthOptional(_)

  const { campaignId } = zx.parseParams(_.params, {
    campaignId: z.string(),
  })

  const { payload } = z
    .object({
      payload: z.string(),
    })
    .parse(await _.request.json())

  const result = await _.context.campaignService.submitAnyonecanpayPledge(
    campaignId,
    payload,
    userId
  )

  return typedjson(result)
}

export function submitAnyonecanpayPledge(params: {
  campaignId: string
  payload: string
}) {
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
