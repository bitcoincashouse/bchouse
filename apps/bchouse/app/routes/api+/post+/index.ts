import { logger } from '@bchouse/utils'
import { ActionFunctionArgs } from '@remix-run/node'
import { ZodError, z } from 'zod'
import { postService } from '~/.server/getContext'
import { postSchema } from '~/.server/types/post'
import httpStatus from '~/.server/utils/http-status'
import { getAuthOptional } from '~/utils/auth'
import { zx } from '~/utils/zodix'

export type FormSchema = z.input<typeof postSchema>
export const action = async (_: ActionFunctionArgs) => {
  try {
    // await ratelimit.limitByIp(_, 'api', true)

    const { userId } = await getAuthOptional(_)

    if (!userId) {
      throw new Response('FORBIDDEN', {
        statusText: 'FORBIDDEN',
        status: httpStatus['FORBIDDEN'],
      })
    }

    const form = await zx.parseForm(_.request, postSchema)

    const newPostId = await postService.addPost(
      userId,
      'parentPost' in form
        ? {
            content: form.comment,
            audienceType: 'CHILD' as const,
            mediaIds: form.mediaIds,
            parentPost: {
              id: form.parentPost.id,
              publishedById: form.parentPost.publishedById,
            },
          }
        : {
            content: form.comment,
            audienceType: form.audienceType,
            mediaIds: form.mediaIds,
            monetization: form.monetization,
          }
    )

    return newPostId
  } catch (err) {
    logger.error(err)

    let message = 'Error submitting post. Please try again.'

    if (err instanceof ZodError) {
      const errors = err.flatten().formErrors
      if (errors.length === 1 && errors[0]) message = errors[0]
    }

    return {
      error: {
        message,
      },
    }
  }
}
