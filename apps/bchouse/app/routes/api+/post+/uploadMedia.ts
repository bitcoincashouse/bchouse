import { ActionFunctionArgs } from '@remix-run/node'
import { z } from 'zod'
import { imageService } from '~/.server/getContext'
import httpStatus from '~/.server/utils/http-status'
import { getAuthOptional } from '~/utils/auth'
import { zx } from '~/utils/zodix'

const formSchema = z
  .object({
    type: z.literal('coverPhoto'),
  })
  .strip()
  .or(
    z.object({
      type: z.literal('post'),
      count: z.coerce.number().min(1).max(8),
    })
  )

export type FormSchema = z.input<typeof formSchema>
export const action = async (_: ActionFunctionArgs) => {
  // await ratelimit.limitByIp(_, 'api', true)

  const { userId } = await getAuthOptional(_)

  if (!userId) {
    throw new Response('Forbidden', {
      statusText: 'FORBIDDEN',
      status: httpStatus['FORBIDDEN'],
    })
  }

  const params = await zx.parseForm(_.request, formSchema)

  return await imageService.createUploadRequest(userId, params)
}
