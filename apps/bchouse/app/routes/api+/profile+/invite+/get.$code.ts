import { LoaderFunctionArgs } from '@remix-run/node'
import { z } from 'zod'
import { authService } from '~/.server/getContext'
import { zx } from '~/utils/zodix'

const inviteSchema = z.object({ code: z.string() })

export const loader = async (_: LoaderFunctionArgs) => {
  // await _.context.ratelimit.limitByIp(_, 'api', true)
  const { code } = zx.parseParams(_.params, inviteSchema)

  const invitationInfo = await authService.getInviteCode({
    code,
  })

  if (!invitationInfo) {
    return null
  }

  return {
    code: invitationInfo.code,
    invitationFrom: invitationInfo.name,
  }
}
