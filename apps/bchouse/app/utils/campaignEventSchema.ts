import { z } from 'zod'

export const campaignEventSchema = z.object({
  campaignId: z.string(),
  total: z.string(),
  fulfillmentTimestamp: z.number().optional(),
  contributionCount: z.number(),
})

export type CampaignEventData = z.infer<typeof campaignEventSchema>
