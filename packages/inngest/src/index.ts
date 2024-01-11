import type { Network } from '@bchouse/utils'
import { EventSchemas, GetEvents, Inngest } from 'inngest'
import { PledgeDepositEvent, TipDepositEvent } from './invoice'

//Other
export type PledgeEvent = {
  data: {
    pledgeRequestId: string
    type?: 'request' | 'anyonecanpay' | 'onchain'
  }
}

export type TipEvent = {
  data: {
    tipRequestId: string
  }
}

export type CompleteCampaignEvent = {
  data: {
    id: string
  }
}

export type ExpiredCampaignEvent = {
  data: {
    id: string
  }
}

export type RebuildRedisEvent = {}

export type DonationCheckEvent = {
  data: {
    donationAddress: string
  }
}

export type CampaignSubscribeEvent = {
  data: {
    id: string
    donationAddress: string
    network: Network
  }
}

export type PledgeCheckEvent = {
  data: {
    campaignId: string
    pledgeId: string
    txid: string
    vout: number
    address: string
    network: Network
  }
}

export type UpdateCampaignEvent = {
  data: {
    campaignId: string
  }
}

type Events = {
  'tip/success': TipEvent
  'pledge/success': PledgeEvent
  'campaign/complete': CompleteCampaignEvent
  'campaign/expired': ExpiredCampaignEvent
  'pledge/subscribe': CampaignSubscribeEvent
  'pledge/check-donation': DonationCheckEvent
  'pledge/check-spent': PledgeCheckEvent
  'redis/rebuild': RebuildRedisEvent
  'pledge/deposit': PledgeDepositEvent
  'tip/deposit': TipDepositEvent
  'campaign/update': UpdateCampaignEvent
}

if (!process.env.INNGEST_BRANCH) {
  throw new Error('Env variable INNGEST_BRANCH is required')
}

// Create a client to send and receive events
export const inngest = new Inngest({
  id: 'flipstarter',
  schemas: new EventSchemas().fromRecord<Events>(),
  eventKey: process.env.INNGEST_EVENT_KEY,
  env: process.env.INNGEST_BRANCH,
})

export { serve } from 'inngest/remix'
export * from './invoice'
export type InngestEvent = GetEvents<typeof inngest>[keyof Events]
export type getInngestEvent<T extends keyof Events> = GetEvents<
  typeof inngest
>[T]
