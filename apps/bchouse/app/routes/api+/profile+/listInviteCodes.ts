import { HttpStatus } from '@bchouse/utils'
import { LoaderFunctionArgs } from '@remix-run/node'
import { authService } from '~/.server/getContext'
import { getAuthRequired } from '~/utils/auth'

export const loader = async (_: LoaderFunctionArgs) => {
  const { userId } = await getAuthRequired(_)

  if (!userId) {
    throw new Response('FORBIDDEN', {
      statusText: 'FORBIDDEN',
      status: HttpStatus.FORBIDDEN,
    })
  }

  const inviteCodes = await authService.getInviteCodes({
    userId,
  })

  return inviteCodes
}
