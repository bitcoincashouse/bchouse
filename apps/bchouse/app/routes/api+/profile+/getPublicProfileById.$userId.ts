import { LoaderFunctionArgs } from '@remix-run/node'
import { z } from 'zod'
import { profileService } from '~/.server/getContext'
import { getAuthOptional } from '~/utils/auth'
import { zx } from '~/utils/zodix'

const paramSchema = z.object({ userId: z.string() })

export const loader = async (_: LoaderFunctionArgs) => {
  // await ratelimit.limitByIp(_, 'api', true)
  const { userId: currentUserId } = await getAuthOptional(_)

  const { userId } = zx.parseParams(_.params, paramSchema)
  const user = profileService.getBasicProfileById(currentUserId, userId)

  return user
}
