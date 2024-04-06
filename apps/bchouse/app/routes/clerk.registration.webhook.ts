import { logger } from '@bchouse/utils'
import { WebhookEvent } from '@clerk/clerk-sdk-node'
import { ActionFunctionArgs } from '@remix-run/node'
import { TRPCError } from '@trpc/server'
import { Webhook } from 'svix'
import { appEnv } from '~/.server/appEnv'
import { userService } from '~/.server/services/getContext'

export async function action(_: ActionFunctionArgs) {
  // Verify the webhook signature
  // See https://docs.svix.com/receiving/verifying-payloads/how
  const payload = Buffer.from(await _.request.arrayBuffer()).toString()
  const headers = Object.fromEntries(_.request.headers.entries()) as Record<
    string,
    string
  >
  const wh = new Webhook(appEnv.CLERK_SIGNIN_WEBHOOK_SECRET as string)

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
    await userService.updateAccountActivity(evt.data.id)
  } else if (evt.type === 'session.created') {
    await userService.updateAccountActivity(evt.data.user_id)
  }

  return {}
}
