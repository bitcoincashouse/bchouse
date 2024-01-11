import { LoaderArgs } from '@remix-run/node'
import { UseDataFunctionReturn, typedjson } from 'remix-typedjson'
import { z } from 'zod'
import { zx } from '~/utils/zodix'

/**
 * URL: /api/media/upload?type=avatar|coverPhoto
 */
export const action = async (_: LoaderArgs) => {
  //TODO: Move to action?)
  const { userId } = await _.context.authService.getAuth(_)
  const params = zx.parseParams(
    _.params,
    z
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
  )

  return typedjson(
    await _.context.imageService.createUploadRequest(userId, params)
  )
}

export type MediaUploadResponse = UseDataFunctionReturn<typeof action>
