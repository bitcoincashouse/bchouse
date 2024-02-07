import { ActionArgs, json } from '@remix-run/node'
import { typedjson } from 'remix-typedjson'
import { z } from 'zod'
import { zx } from '~/utils/zodix'

export const action = async (_: ActionArgs) => {
  try {
    await _.context.ratelimit.limitByIp(_, 'api', true)

    const { userId, sessionId } = await _.context.authService.getAuth(_)
    const { _action: action, profileId } = await zx.parseForm(_.request, {
      _action: z.enum(['follow', 'unfollow']),
      profileId: z.string().nonempty(),
    })

    if (action === 'follow') {
      await _.context.profileService.addUserFollow(userId, sessionId, profileId)
    } else {
      await _.context.profileService.removeUserFollow(
        userId,
        sessionId,
        profileId
      )
    }

    return json(profileId)
  } catch (err) {
    return typedjson({ error: err })
  }
}
