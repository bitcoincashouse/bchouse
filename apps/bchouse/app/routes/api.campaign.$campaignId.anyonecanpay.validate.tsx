import { logger } from '@bchouse/utils'
import { LoaderFunctionArgs } from '@remix-run/node'
import { useMutation } from '@tanstack/react-query'
import { useMemo } from 'react'
import { typedjson } from 'remix-typedjson'
import { z } from 'zod'
import { zx } from '~/utils/zodix'

export const action = async (_: LoaderFunctionArgs) => {
  try {
    await _.context.ratelimit.limitByIp(_, 'api', true)

    const { campaignId } = zx.parseParams(_.params, {
      campaignId: z.string(),
    })

    const { payload } = z
      .object({
        payload: z.string(),
      })
      .parse(await _.request.json())

    const isValid = await _.context.campaignService.validateAnyonecanpayPledge(
      campaignId,
      payload
    )

    return typedjson({ isValid })
  } catch (err) {
    logger.error(err)
    return typedjson({ isValid: false })
  }
}

export function useValidateAnyonecanpayPledgeFetcher(campaignId: string) {
  return useMutation(async (payload: string) => {
    return fetch(`/api/campaign/${campaignId}/anyonecanpay/validate`, {
      method: 'POST',
      body: JSON.stringify({ payload }),
    })
      .then(async (res) => {
        return z.object({ isValid: z.boolean() }).parse(await res.json())
      })
      .catch(() => ({ isValid: false }))
  })
}

type Recipient = {
  satoshis: number
  address: string
}

export function useExternalWalletPayload({
  donationAmount,
  recipients,
  expires,
  name,
  comment,
}: {
  donationAmount: number
  recipients: Array<Recipient>
  expires: number
  name?: string
  comment?: string
}) {
  return useMemo(() => {
    return createExternalWalletPayload(
      donationAmount,
      recipients,
      expires,
      name,
      comment
    )
  }, [donationAmount, recipients, expires, name, comment])
}

function createExternalWalletPayload(
  donationAmount: number,
  recipients: Recipient[],
  expires: number,
  name?: string,
  comment?: string
) {
  const outputs = recipients.map((recipient) => {
    const outputValue = recipient.satoshis
    const outputAddress = recipient.address

    // Add the recipients outputs to the request.
    return { value: outputValue, address: outputAddress }
  })

  // Assemble an assurance request template.
  const template = JSON.stringify({
    outputs,
    data: {
      alias: name || '',
      comment: comment || '',
    },
    donation: {
      amount: Number(donationAmount),
    },
    expires: expires,
  })

  return Buffer.from(template, 'utf8').toString('base64')
}
