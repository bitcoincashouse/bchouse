import { LoaderFunctionArgs } from '@remix-run/node'
import { z } from 'zod'
import { profileService } from '~/.server/getContext'
import { getAuthOptional } from '~/utils/auth'
import { zx } from '~/utils/zodix'

const paramSchema = z.object({ profileId: z.string().nonempty() })

export const loader = async (_: LoaderFunctionArgs) => {
  const { userId } = await getAuthOptional(_)

  if (!userId) {
    return false
  }

  const { profileId } = zx.parseParams(_.params, paramSchema)
  return await profileService.getIsFollowing(userId, profileId)
}
