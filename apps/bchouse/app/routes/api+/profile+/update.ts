import { HttpStatus } from '@bchouse/utils'
import { ActionFunctionArgs } from '@remix-run/node'
import { z } from 'zod'
import { profileService } from '~/.server/getContext'
import { getAuthRequired } from '~/utils/auth'
import { zx } from '~/utils/zodix'

const formSchema = z
  .object({
    about: z
      .string()
      .optional()
      .nullable()
      .transform((str) => str || undefined),
    bchAddress: z
      .string()
      .optional()
      .nullable()
      .transform((str) => str || undefined),
    company: z
      .string()
      .optional()
      .nullable()
      .transform((str) => str || undefined),
    coverPhotoMediaId: z
      .string()
      .optional()
      .nullable()
      .transform((str) => str || undefined),
    location: z
      .string()
      .optional()
      .nullable()
      .transform((str) => str || undefined),
    title: z
      .string()
      .optional()
      .nullable()
      .transform((str) => str || undefined),
    website: z
      .string()
      .optional()
      .nullable()
      .transform((str) => str || undefined),
  })
  .strip()

export type FormSchema = z.input<typeof formSchema>

export const action = async (_: ActionFunctionArgs) => {
  // await opts.ctx.ratelimit.limitByIp(_, 'api', true)
  try {
    const { userId } = await getAuthRequired(_)

    if (!userId) {
      throw new Response('FORBIDDEN', {
        statusText: 'FORBIDDEN',
        status: HttpStatus.FORBIDDEN,
      })
    }

    const body = await zx.parseForm(_.request, formSchema)

    const user = await profileService.updateProfile(userId, body)
    return user
  } catch (err) {
    return { error: err }
  }
}
