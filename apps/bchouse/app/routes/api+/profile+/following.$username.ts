import { HttpStatus } from '@bchouse/utils'
import { LoaderFunctionArgs } from '@remix-run/node'
import { z } from 'zod'
import { profileService } from '~/.server/getContext'
import { getAuthOptional } from '~/utils/auth'
import { zx } from '~/utils/zodix'

const paramSchema = z.object({ username: z.string() })
export const loader = async (_: LoaderFunctionArgs) => {
  const { userId } = await getAuthOptional(_)

  if (!userId) {
    throw new Response('FORBIDDEN', {
      statusText: 'FORBIDDEN',
      status: HttpStatus.FORBIDDEN,
    })
  }

  const { username } = zx.parseParams(_.params, paramSchema)
  return await profileService.getFollowing(userId, username)
}
