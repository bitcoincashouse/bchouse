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

export type RebuildRedisEvent = {
  data: {
    types?: Array<'posts' | 'users'> | 'all'
  }
}

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

export const schemas = new EventSchemas().fromRecord<Events>()

export { serve } from 'inngest/remix'
export * from './invoice.js'
export type AppInngest = Inngest<{ id: string; schemas: typeof schemas }>
export type InngestEvent = GetEvents<AppInngest>[keyof Events]
export type getInngestEvent<T extends keyof Events> = GetEvents<AppInngest>[T]
