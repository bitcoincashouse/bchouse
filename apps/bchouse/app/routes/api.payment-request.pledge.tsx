import { ActionArgs, json } from '@remix-run/node'
import { useQuery } from '@tanstack/react-query'
import { z } from 'zod'
import { logger } from '~/utils/logger'
import { getPledgeSession } from '~/utils/pledgeCookie.server'

export const action = async (_: ActionArgs) => {
  await _.context.ratelimit.limitByIp(_, 'api', true)

  const { userId } = await _.context.authService.getAuthOptional(_)
  const formData = await _.request.json()

  const {
    amount: satoshis,
    address: returnAddress,
    campaignId,
  } = z
    .object({
      amount: z.coerce.bigint(),
      address: z.string(),
      campaignId: z.string(),
    })
    .parse(formData)

  const { paymentUrl, invoiceId, network, secret } =
    await _.context.pledgeService.createInvoice({
      campaignId,
      userId,
      paygateUrl: _.context.paygateUrl,
      amount: satoshis,
      refundAddress: returnAddress,
      bchouseUrl: _.context.bchouseUrl,
    })

  let headers = {} as Record<string, string>

  if (!userId) {
    const pledgeSession = await getPledgeSession(_.request)
    pledgeSession.addPledgeSecret(secret)
    headers['Set-Cookie'] = await pledgeSession.commit()
  }

  return json(
    {
      paymentUrl,
      requestId: invoiceId,
      secret,
    },
    {
      headers,
    }
  )
}

export async function fetchPaymentRequest(params: {
  amount: number
  address: string
  campaignId: string
}) {
  return await fetch(
    '/api/payment-request/pledge?_data=routes/api.payment-request.pledge',
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
          secret: z.string(),
        })
        .parse(data)
    )
}

export function clearPaymentRequestQuery(params: {
  amount: number
  address: string
  campaignId: string
}) {
  const queryClient = window.queryClient
  return queryClient.invalidateQueries({
    queryKey: ['paymentRequest', params],
  })
}

export function queryPaymentRequest(params: {
  amount: number
  address: string
  campaignId: string
}) {
  const queryClient = window.queryClient
  return queryClient.fetchQuery(
    ['paymentRequest', params],
    () => fetchPaymentRequest(params),
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
  return useQuery(
    ['paymentRequest', params],
    async () => fetchPaymentRequest(params as NonNullable<typeof params>),
    {
      enabled:
        !!params && !!params.amount && !!params.address && !!params.campaignId,
      //Match expiration time
      staleTime: 15 * 60 * 1000,
      //If unloaded, do not use cache
      cacheTime: 0,
    }
  )
}
