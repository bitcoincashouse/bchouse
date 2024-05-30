import { moment } from '@bchouse/utils'
import { useMemo } from 'react'
import { useCampaignThread } from '../../thread-provider'

export function useCampaignComplete() {
  const { main: campaign } = useCampaignThread()

  return useMemo(
    () =>
      campaign.monetization
        ? !!campaign.monetization.fulfilledAt ||
          campaign.monetization.expiresAt <= moment().unix()
        : false,
    [campaign.monetization]
  )
}
