import { HttpStatus } from '@bchouse/utils'
import { ActionFunctionArgs } from '@remix-run/node'
import { userService } from '~/.server/getContext'
import { getAuthOptional } from '~/utils/auth'

export const action = async (_: ActionFunctionArgs) => {
  const { userId } = await getAuthOptional(_)

  if (!userId) {
    throw new Response('FORBIDDEN', {
      statusText: 'FORBIDDEN',
      status: HttpStatus.FORBIDDEN,
    })
  }

  const updated = await userService.updateLastViewedNotifications(userId)

  return updated
}
