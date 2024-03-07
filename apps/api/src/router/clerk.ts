import { logger } from '@bchouse/utils'
import { WebhookEvent } from '@clerk/clerk-sdk-node'
import { TRPCError } from '@trpc/server'
import { Webhook } from 'svix'
import { publicProcedure, router } from '../trpc'

export const clerkRouter = router({
  clerkRegistrationWebhook: publicProcedure.mutation(async (opts) => {
    // Verify the webhook signature
    // See https://docs.svix.com/receiving/verifying-payloads/how
    const payload = Buffer.from(await opts.ctx.req.body).toString()
    const headers = opts.ctx.req.headers as Record<string, string>
    const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET as string)

    let evt

    try {
      evt = wh.verify(payload, headers) as WebhookEvent
    } catch (_) {
      logger.warn('Unauthorized access attempt to registration webhook')

      throw new TRPCError({
        code: 'NOT_FOUND',
      })
    }

    if (evt.type === 'user.created') {
      await opts.ctx.userService.createAccountWebhook(evt.data)
    } else if (evt.type === 'user.updated') {
      await opts.ctx.userService.updateAccountWebhook(evt.data)
    } else if (evt.type === 'user.deleted') {
      await opts.ctx.userService.deleteAccountWebhook(evt.data)
    }

    return {}
  }),
  clerkLoginWebhook: publicProcedure.mutation(async (opts) => {
    // Verify the webhook signature
    // See https://docs.svix.com/receiving/verifying-payloads/how
    const payload = Buffer.from(await opts.ctx.req.body).toString()
    const headers = opts.ctx.req.headers as Record<string, string>
    const wh = new Webhook(process.env.CLERK_SIGNIN_WEBHOOK_SECRET as string)

    let evt

    try {
      evt = wh.verify(payload, headers) as WebhookEvent
    } catch (_) {
      logger.warn('Unauthorized access attempt to registration webhook')

      throw new TRPCError({
        code: 'NOT_FOUND',
      })
    }

    if (evt.type === 'user.created' || evt.type === 'user.updated') {
      await opts.ctx.userService.updateAccountActivity(evt.data.id)
    } else if (evt.type === 'session.created') {
      await opts.ctx.userService.updateAccountActivity(evt.data.user_id)
    }

    return {}
  }),
})
