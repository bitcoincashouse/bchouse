import { InngestEvent, inngest } from '@bchouse/inngest'
import { Network, campaignEventSchema, logger } from '@bchouse/utils'
import { LoaderArgs } from '@remix-run/node'
import { useRevalidator } from '@remix-run/react'
import { useEffect, useMemo, useState } from 'react'
import { z } from 'zod'
import { eventStream } from '~/utils/event-stream'
import { zx } from '~/utils/zodix'

export async function loader(_: LoaderArgs) {
  await _.context.ratelimit.limitByIp(_, 'api', true)

  const { campaignId } = zx.parseParams(_.params, {
    campaignId: z.string(),
  })

  const [campaign, anyonecanpayPledges] = await Promise.all([
    _.context.campaignService.getCampaignByIdWithPledges(campaignId),
    _.context.pledgeService.getAnyonecanpayPledges({ campaignId }),
  ])

  if (campaign.fulfillmentTimestamp) {
    return null
  }

  const events: InngestEvent[] = [
    {
      name: 'pledge/subscribe',
      data: {
        id: campaign.campaignId,
        donationAddress: campaign.donationAddress,
        network: campaign.network,
      },
    },
  ]

  if (campaign.donationAddress) {
    events.push({
      name: 'pledge/check-donation',
      data: {
        donationAddress: campaign.donationAddress,
      },
    })
  }

  anyonecanpayPledges.forEach((pledge) => {
    events.push({
      name: 'pledge/check-spent',
      data: {
        campaignId: campaign.campaignId,
        pledgeId: pledge.pledgeId,
        txid: pledge.txid,
        vout: pledge.vout,
        address: pledge.address,
        network: campaign.network,
      },
    })
  })

  inngest.send(events).catch((err) => {
    logger.error('failed to send events', campaignId, err)
  })

  return eventStream(_.request.signal, function setup(send) {
    const subscriptionId = _.context.campaignService.subscribe(
      campaignId,
      (event) => {
        send({ event: 'message', data: JSON.stringify(event) })
      }
    )

    return async function clear() {
      _.context.campaignService.unsubscribe(campaignId, subscriptionId)
    }
  })
}

export function useCampaignData(
  campaignId: string,
  initialData: {
    raised: number
    fulfilledAt?: number
    contributionCount: number
  }
) {
  const [campaignDetails, setCampaignDetails] = useState(initialData)
  const revalidator = useRevalidator()

  useEffect(() => {
    const source = new EventSource(`/api/campaign/subscribe/${campaignId}`, {})

    const handler = (event: MessageEvent) => {
      const result = campaignEventSchema.safeParse(JSON.parse(event.data))
      if (result.success) {
        setCampaignDetails({
          raised: Number(result.data.total),
          fulfilledAt: Number(result.data.fulfillmentTimestamp),
          contributionCount: Number(result.data.contributionCount),
        })

        revalidator.revalidate()
      }
    }

    source.addEventListener('message', handler)

    return () => {
      source.removeEventListener('message', handler)
      source.close()
    }
  }, [initialData])

  return campaignDetails
}
export type CampaignData = {
  campaignId: string
  amount: number
  address: string
  raised: number
  contributionCount: number
  donationAddress: string
  expiresAt: number
  fulfilledAt?: number
  network: Network
}

export function CampaignSubscription({
  campaign,
  children,
}: {
  children: (campaignData: CampaignData) => React.ReactNode
  campaign: CampaignData
}) {
  const updatedData = useCampaignData(campaign.campaignId, campaign)

  const paymentData = useMemo(() => {
    return {
      ...campaign,
      ...updatedData,
    }
  }, [campaign, updatedData])

  return children(paymentData)
}
