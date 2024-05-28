import { LoaderFunctionArgs } from '@remix-run/node'
import { z } from 'zod'
import { postService } from '~/.server/getContext'
import { getAuthRequired } from '~/utils/auth'
import { zx } from '~/utils/zodix'

export const loader = async (_: LoaderFunctionArgs) => {
  const { userId } = await getAuthRequired(_)
  const { postId } = zx.parseParams(_.params, z.object({ postId: z.string() }))

  const mainPost = await postService.getPost(userId, postId)

  return mainPost
}
