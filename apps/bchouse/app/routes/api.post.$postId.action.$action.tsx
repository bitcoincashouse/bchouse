import { ActionArgs } from '@remix-run/node'
import { useCallback } from 'react'
import { typedjson } from 'remix-typedjson'
import { z } from 'zod'
import { zx } from '~/utils/zodix'

const postActionSchema = z.object({
  postId: z.string(),
  action: z.enum([
    'embed',
    'report',
    'follow:add',
    'follow:remove',
    'list:add',
    'list:remove',
    'mute:add',
    'mute:remove',
    'block:add',
    'block:remove',
    'post:remove',
  ]),
})

export type PostActionType = z.infer<typeof postActionSchema>['action']

export const action = async (_: ActionArgs) => {
  const { userId } = await _.context.authService.getAuthOptional(_)
  const { action, postId } = zx.parseParams(_.params, postActionSchema)

  if (userId && action === 'post:remove') {
    await _.context.postService.removePost(userId, postId)
  }

  return typedjson({})
}

export function usePostActionSubmit() {
  return useCallback((postId: string, action: PostActionType) => {
    fetch(
      `/api/post/${postId}/action/${encodeURIComponent(
        action
      )}?_data=routes/api.post.$postId.action.$action`,
      {
        method: 'POST',
      }
    )
  }, [])
}
