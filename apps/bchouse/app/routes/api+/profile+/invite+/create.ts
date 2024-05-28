import { isApplicationError, isClerkError } from '@bchouse/utils'
import { ActionFunctionArgs } from '@remix-run/node'
import httpStatus from 'http-status'
import { authService } from '~/.server/getContext'
import { getAuthOptional } from '~/utils/auth'

export const action = async (_: ActionFunctionArgs) => {
  try {
    const { userId } = await getAuthOptional(_)

    if (!userId) {
      throw new Response('Forbidden', {
        statusText: 'FORBIDDEN',
        status: httpStatus['FORBIDDEN'],
      })
    }

    const result = await authService.createInviteCode({
      userId,
    })

    return {
      error: false as const,
    }
  } catch (err) {
    if (isClerkError(err) && err.errors[0]) {
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
