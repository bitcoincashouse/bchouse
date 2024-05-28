import { HttpStatus } from '@bchouse/utils'
import { LoaderFunctionArgs } from '@remix-run/node'
import { userService } from '~/.server/getContext'
import { getAuthOptional } from '~/utils/auth'

export const loader = async (_: LoaderFunctionArgs) => {
  const { userId } = await getAuthOptional(_)

  if (!userId) {
    throw new Response('FORBIDDEN', {
      statusText: 'FORBIDDEN',
      status: HttpStatus.FORBIDDEN,
    })
  }

  const notifications = await userService.getNotifications(userId)

  return {
    notifications,
  }
}
