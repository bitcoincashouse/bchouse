import { LoaderFunctionArgs } from '@remix-run/node'
import { z } from 'zod'
import { postService } from '~/.server/getContext'
import { getAuthOptional } from '~/utils/auth'
import { zx } from '~/utils/zodix'

const paramSchema = z.object({ statusId: z.string() })

export const loader = async (_: LoaderFunctionArgs) => {
  const { userId } = await getAuthOptional(_)
  const { statusId: postId } = zx.parseParams(_.params, paramSchema)

  const {
    ancestors,
    previousCursor,
    mainPost,
    donorPosts,
    children,
    nextCursor,
  } = await postService.getCampaignPostWithChildren(userId, postId)

  //TODO: Fetch parents dynamically
  return {
    ancestors,
    mainPost,
    children,
    donorPosts,
    nextCursor: nextCursor,
    previousCursor,
  }
}
