import { useMutation } from '@tanstack/react-query'
import { useMemo } from 'react'
import { z } from 'zod'

export function useValidateAnyonecanpayPledgeFetcher(campaignId: string) {
  //TODO: trpc.validateAnyonecanpay
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
