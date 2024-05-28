import { ActionFunctionArgs } from '@remix-run/node'
import { z } from 'zod'
import { postService, profileService, userService } from '~/.server/getContext'
import { getAuthRequired } from '~/utils/auth'
import { zx } from '~/utils/zodix'

export const formSchema = z.object({
  postId: z.string(),
  authorId: z.string(),
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
    //Post actions
    'like:add',
    'like:remove',
    'repost:add',
    'repost:remove',
  ]),
})

export type FormSchema = z.infer<typeof formSchema>
export const action = async (_: ActionFunctionArgs) => {
  // await ratelimit.limitByIp(_, 'api', true)

  const { userId, sessionId } = await getAuthRequired(_)
  const { action, postId, authorId } = await zx.parseForm(_.request, formSchema)

  if (!userId) {
    return null
  }

  if (action === 'post:remove') {
    await postService.removePost(userId, postId)
  } else if (action === 'repost:add') {
    await postService.addRepost(userId, postId, authorId)
  } else if (action === 'repost:remove') {
    await postService.removeRepost(userId, postId, authorId)
  } else if (action === 'like:add') {
    await postService.addPostLike(userId, postId, authorId)
  } else if (action === 'like:remove') {
    await postService.removePostLike(userId, postId, authorId)
  } else if (action === 'mute:add') {
    await userService.addMute(userId, authorId)
  } else if (action === 'mute:remove') {
    await userService.removeMute(userId, authorId)
  } else if (action === 'block:add') {
    await userService.addBlock(userId, authorId)
  } else if (action === 'block:remove') {
    await userService.removeBlock(userId, authorId)
  } else if (action === 'report') {
    await postService.reportPost(userId, postId)
  } else if (action === 'follow:add') {
    await profileService.addUserFollow(userId, sessionId, authorId)
  } else if (action === 'follow:remove') {
    await profileService.removeUserFollow(userId, sessionId, authorId)
  }

  return {}
}
