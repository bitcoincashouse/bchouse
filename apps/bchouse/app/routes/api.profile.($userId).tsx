import { ActionArgs, LoaderArgs } from '@remix-run/node'
import { typedjson } from 'remix-typedjson'
import { z } from 'zod'
import { zx } from '~/utils/zodix'

export const loader = async (_: LoaderArgs) => {
  const { userId: currentUserId } = await _.context.authService.getAuthOptional(
    _
  )
  const { userId } = zx.parseParams(_.params, {
    userId: z.string(),
  })

  const user = await _.context.profileService.getBasicProfileById(
    currentUserId,
    userId
  )

  return typedjson(user)
}

export const action = async (_: ActionArgs) => {
  try {
    const { userId } = await _.context.authService.getAuth(_)
    const body = await zx.parseForm(
      _.request,
      z
        .object({
          about: z.string().optional(),
          bchAddress: z.string().optional(),
          company: z.string().optional(),
          coverPhotoMediaId: z.string().optional(),
          location: z.string().optional(),
          title: z.string().optional(),
          website: z.string().optional(),
        })
        .strip()
    )

    const user = await _.context.profileService.updateProfile(userId, body)
    return typedjson(user)
  } catch (err) {
    return typedjson({ error: err })
  }
}
