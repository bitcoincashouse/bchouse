import { ActionArgs, json } from '@remix-run/node'
import { ClientActionFunctionArgs } from '@remix-run/react'
import { typedjson } from 'remix-typedjson'
import { z } from 'zod'
import { queryClient } from '~/utils/query-client'
import { zx } from '~/utils/zodix'

export const action = async (_: ActionArgs) => {
  try {
    const { userId } = await _.context.authService.getAuth(_)
    const formData = await _.request.formData()

    const { postId } = zx.parseParams(_.params, {
      postId: z.string(),
    })

    const { _action: action, postAuthorId } = await zx.parseForm(formData, {
      _action: z.enum(['addRepost', 'removeRepost']).optional(),
      postAuthorId: z.string(),
    })

    if (action === 'addRepost') {
      await _.context.postService.addRepost(userId, postId, postAuthorId)
    } else {
      await _.context.postService.removeRepost(userId, postId, postAuthorId)
    }

    return json(postId)
  } catch (err) {
    return typedjson({ error: err })
  }
}

export const clientAction = async (args: ClientActionFunctionArgs) => {
  const { postId } = zx.parseParams(args.params, {
    postId: z.string(),
  })

  const result = await args.serverAction()

  //Refetch related loader for optimistic updates (submission and loading state will match useFetcher expectations)
  await queryClient.refetchQueries({
    queryKey: ['feed'],
    refetchPage: (page: { posts: { id: string }[] }, i, all) => {
      return page.posts.some((post) => post.id === postId)
    },
  })

  return result
}
