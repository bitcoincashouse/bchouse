import { HttpStatus, logger } from '@bchouse/utils'
import type { WebhookEvent } from '@clerk/clerk-sdk-node'
import { ActionArgs, json } from '@remix-run/node'
import { Webhook } from 'svix'

export const action = async (_: ActionArgs) => {
  // Verify the webhook signature
  // See https://docs.svix.com/receiving/verifying-payloads/how
  const payload = Buffer.from(await _.request.arrayBuffer()).toString()
  const headers = Object.fromEntries(_.request.headers.entries())
  const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET as string)

  let evt

  try {
    evt = wh.verify(payload, headers) as WebhookEvent
  } catch (_) {
    logger.warn('Unauthorized access attempt to registration webhook')
    throw new Response('POST action not found', {
      status: HttpStatus.NOT_FOUND,
    })
  }

  if (evt.type === 'user.created') {
    await _.context.userService.createAccountWebhook(evt.data)
  } else if (evt.type === 'user.updated') {
    await _.context.userService.updateAccountWebhook(evt.data)
  } else if (evt.type === 'user.deleted') {
    await _.context.userService.deleteAccountWebhook(evt.data)
  }

  return json({})
}
