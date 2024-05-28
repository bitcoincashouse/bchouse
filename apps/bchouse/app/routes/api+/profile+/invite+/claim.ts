import { isApplicationError, isClerkError, logger } from '@bchouse/utils'
import { ActionFunctionArgs } from '@remix-run/node'
import { z } from 'zod'
import { authService } from '~/.server/getContext'
import { zx } from '~/utils/zodix'

const formSchema = z.object({
  emailAddress: z.string().email(),
  code: z.string(),
})

export type FormSchema = z.infer<typeof formSchema>

export const action = async (_: ActionFunctionArgs) => {
  try {
    const { emailAddress, code } = await zx.parseForm(_.request, formSchema)

    const result = await authService.claimInviteCode({
      code,
      emailAddress,
    })

    return {
      error: false as const,
      emailAddress: emailAddress,
    }
  } catch (err) {
    logger.error('Error inviting user', err)

    if (isClerkError(err) && err.errors[0]) {
      if (err.errors[0].message === 'duplicate allowlist identifier') {
        return {
          error: true as const,
          message: 'Email already invited',
        }
      }

      return { error: true as const, message: err.errors[0].message }
    }

    if (isApplicationError(err) && err.errors[0]) {
      return { error: true as const, message: err.errors[0].message }
    }

    return {
      error: true as const,
      message: 'Error inviting user, please try again.',
    }
  }
}
