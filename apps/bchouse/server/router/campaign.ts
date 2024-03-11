import { logger } from '@bchouse/utils'
import { z } from 'zod'
import { publicProcedure, router } from '../trpc'

const anyonecanpayInput = z.object({
  campaignId: z.string(),
  payload: z.string(),
})

const pledgePaymentRequestInput = z.object({
  amount: z
    .string()
    .or(z.number())
    .or(z.bigint())
    .transform((amount) => BigInt(amount.toString())),
  address: z.string(),
  campaignId: z.string(),
})

const commentInput = z.object({
  name: z.string().optional(),
  comment: z.string().optional(),
  secret: z.string(),
})

export const campaignRouter = router({
  listPledges: publicProcedure.query(async (opts) => {
    const { userId } = opts.ctx.auth

    // const pledgeSession = await getPledgeSession(_.request)
    // const pledgeSecrets = pledgeSession.getPledgeSecrets()

    const pledges = await opts.ctx.pledgeService.getPledges({
      userId,
      pledgeSecrets: [],
    })

    return pledges.map((pledge) => ({
      ...pledge,
      satoshis: pledge.satoshis.toString(),
      forwardTx: pledge.forwardTx
        ? {
            ...pledge.forwardTx,
            pledgedAmount: pledge.forwardTx.pledgedAmount.toString(),
          }
        : null,
    }))
  }),
  listActive: publicProcedure
    .input(z.object({ username: z.string().optional() }))
    .query(async (opts) => {
      // await opts.ctx.ratelimit.limitByIp(_, 'api', true)

      const username = opts.input.username

      const activeCampaigns = await opts.ctx.campaignService.getActiveCampaigns(
        {
          limit: 2,
          username,
        }
      )

      return activeCampaigns.map((c) => ({
        id: c.id,
        title: c.title,
        expires: c.expires,
        goal: Number(c.goal || 0),
        raised: Number(c.raised || 0),
        pledges: Number(c.pledges || 0),
        username: c.username,
        statusId: c.statusId,
      }))
    }),
  listContributionHighlights: publicProcedure
    .input(z.object({ campaignId: z.string() }))
    .query(async (opts) => {
      // await opts.ctx.ratelimit.limitByIp(_, 'api', true)

      const { campaignId } = opts.input

      const result = await opts.ctx.campaignService.getUiContributions(
        campaignId
      )
      return result
    }),
  listContributions: publicProcedure
    .input(z.object({ campaignId: z.string() }))
    .query(async (opts) => {
      // await opts.ctx.ratelimit.limitByIp(_, 'api', true)

      const { campaignId } = opts.input

      const result = await opts.ctx.campaignService.getAllContributions(
        campaignId
      )
      return result
    }),
  submitComment: publicProcedure.input(commentInput).mutation(async (opts) => {
    try {
      // await opts.ctx.ratelimit.limitByIp(_, 'api', true)

      const { name, comment, secret } = opts.input

      if (!name && !comment) {
        return false
      }

      const success = await opts.ctx.pledgeService.addComment({
        name,
        comment,
        secret,
      })
      return success
    } catch (err) {
      logger.error(err)
      throw err
    }
  }),
  validateAnyonecanpay: publicProcedure
    .input(anyonecanpayInput)
    .mutation(async (opts) => {
      try {
        // await opts.ctx.ratelimit.limitByIp(_, 'api', true)

        const { campaignId, payload } = opts.input

        const isValid =
          await opts.ctx.campaignService.validateAnyonecanpayPledge(
            campaignId,
            payload
          )

        return { isValid }
      } catch (err) {
        logger.error(err)
        return { isValid: false }
      }
    }),
  submitAnyonecanpay: publicProcedure
    .input(anyonecanpayInput)
    .mutation(async (opts) => {
      // await opts.ctx.ratelimit.limitByIp(_, 'api', true)

      const { userId } = opts.ctx.auth
      const { campaignId, payload } = opts.input

      const result = await opts.ctx.campaignService.submitAnyonecanpayPledge(
        campaignId,
        payload,
        userId
      )

      return result
    }),
  //More like mutation
  paymentRequestPledge: publicProcedure
    .input(pledgePaymentRequestInput)
    .query(async (opts) => {
      // await opts.ctx.ratelimit.limitByIp(_, 'api', true)

      const { userId } = await opts.ctx.auth

      const {
        amount: satoshis,
        address: returnAddress,
        campaignId,
      } = opts.input

      const { paymentUrl, invoiceId, network, secret } =
        await opts.ctx.pledgeService.createInvoice({
          campaignId,
          userId,
          paygateUrl: opts.ctx.paygateUrl,
          amount: satoshis,
          refundAddress: returnAddress,
          bchouseUrl: opts.ctx.bchouseUrl,
        })

      let headers = {} as Record<string, string>

      //TODO: Add some way for non-logged in users to view
      // Besides using WalletConnect
      // if (!userId) {
      //   const pledgeSession = await getPledgeSession(_.request)
      //   pledgeSession.addPledgeSecret(secret)
      //   headers['Set-Cookie'] = await pledgeSession.commit()
      // }

      return {
        paymentUrl,
        requestId: invoiceId,
        secret,
      }
    }),
  getPledge: publicProcedure
    .input(z.object({ secret: z.string() }))
    .query(async (opts) => {
      const { secret } = opts.input
      const pledge = await opts.ctx.pledgeService.getPledgeBySecret({ secret })
      return {
        ...pledge,
        satoshis: pledge.satoshis.toString(),
        forwardTx: pledge.forwardTx
          ? {
              ...pledge.forwardTx,
              pledgedAmount: pledge.forwardTx.pledgedAmount.toString(),
            }
          : null,
      }
    }),
  refundPledge: publicProcedure
    .input(z.object({ secret: z.string() }))
    .mutation(async (opts) => {
      try {
        // await opts.ctx.ratelimit.limitByIp(_, 'api', true)

        const { secret } = opts.input
        const result = await opts.ctx.pledgeService.cancelPledge({ secret })
        return result
      } catch (err) {
        logger.error(err)
        return { error: true, txid: null }
      }
    }),
})
