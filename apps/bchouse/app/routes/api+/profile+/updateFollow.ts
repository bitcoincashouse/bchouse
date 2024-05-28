import { HttpStatus } from '@bchouse/utils'
import { ActionFunctionArgs } from '@remix-run/node'
import { z } from 'zod'
import { profileService } from '~/.server/getContext'
import { getAuthRequired } from '~/utils/auth'
import { zx } from '~/utils/zodix'

const formSchema = z.object({
  action: z.enum(['follow', 'unfollow']),
  profileId: z.string().nonempty(),
})

export type FormSchema = z.infer<typeof formSchema>

export const action = async (_: ActionFunctionArgs) => {
  // await opts.ctx.ratelimit.limitByIp(_, 'api', true)
  try {
    // await ratelimit.limitByIp(_, 'api', true)

    const { userId, sessionId } = await getAuthRequired(_)
    if (!userId) {
      throw new Response('FORBIDDEN', {
        statusText: 'FORBIDDEN',
        status: HttpStatus.FORBIDDEN,
      })
    }

    const { action, profileId } = await zx.parseForm(_.request, formSchema)

    if (action === 'follow') {
      await profileService.addUserFollow(userId, sessionId, profileId)
    } else {
      await profileService.removeUserFollow(userId, sessionId, profileId)
    }

    return profileId
  } catch (err) {
    return { error: err }
  }
}
