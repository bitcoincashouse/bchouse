import { HttpStatus, logger } from '@bchouse/utils'
import { WebhookEvent } from '@clerk/clerk-sdk-node'
import { ActionFunctionArgs } from '@remix-run/node'
import { Webhook } from 'svix'
import { appEnv } from '~/.server/appEnv'
import { userService } from '~/.server/getContext'

export async function action(_: ActionFunctionArgs) {
  // Verify the webhook signature
  // See https://docs.svix.com/receiving/verifying-payloads/how
  const payload = Buffer.from(await _.request.arrayBuffer()).toString()
  const headers = Object.fromEntries(_.request.headers.entries()) as Record<
    string,
    string
  >
  const wh = new Webhook(appEnv.CLERK_WEBHOOK_SECRET as string)

  let evt

  try {
    evt = wh.verify(payload, headers) as WebhookEvent
  } catch (_) {
    logger.warn('Unauthorized access attempt to registration webhook')

    throw new Response('Not found', {
      statusText: 'NOT FOUND',
      status: HttpStatus.NOT_FOUND,
    })
  }

  if (evt.type === 'user.created') {
    await userService.createAccountWebhook(evt.data)
  } else if (evt.type === 'user.updated') {
    await userService.updateAccountWebhook(evt.data)
  } else if (evt.type === 'user.deleted') {
    await userService.deleteAccountWebhook(evt.data)
  }

  return {}
}
