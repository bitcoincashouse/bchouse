import { ActionArgs } from '@remix-run/node'
import { ClientActionFunctionArgs } from '@remix-run/react'
import { useCallback } from 'react'
import { typedjson } from 'remix-typedjson'
import { z } from 'zod'
import { PostCardModel } from '~/components/post/types'
import { queryClient } from '~/utils/query-client'
import { zx } from '~/utils/zodix'

const postActionSchema = z.object({
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

export type PostActionType = z.infer<typeof postActionSchema>['action']

export const action = async (_: ActionArgs) => {
  const { userId } = await _.context.authService.getAuthOptional(_)
  const { action, postId, authorId } = zx.parseParams(
    _.params,
    postActionSchema
  )

  if (!userId) {
    return null
  }

  if (action === 'post:remove') {
    await _.context.postService.removePost(userId, postId)
  } else if (action === 'repost:add') {
    await _.context.postService.addRepost(userId, postId, authorId)
  } else if (action === 'repost:remove') {
    await _.context.postService.removeRepost(userId, postId, authorId)
  } else if (action === 'like:add') {
    await _.context.postService.addPostLike(userId, postId, authorId)
  } else if (action === 'like:remove') {
    await _.context.postService.removePostLike(userId, postId, authorId)
  }

  return typedjson({})
}

function updatePost(
  post: PostCardModel,
  action: z.infer<typeof postActionSchema>['action']
) {
  console.log({ clientAction: action })

  if (action === 'repost:add' || action === 'repost:remove') {
    const wasReposted = action === 'repost:add'
    if (wasReposted !== post.wasReposted) {
      const repostCount = post.repostCount + (wasReposted ? 1 : -1)
      return {
        ...post,
        wasReposted,
        repostCount,
      }
    }
  } else if (action === 'like:add' || action === 'like:remove') {
    const wasLiked = action === 'like:add'
    if (wasLiked !== post.wasLiked) {
      const likeCount = post.likeCount + (wasLiked ? 1 : -1)
      return {
        ...post,
        wasLiked,
        likeCount,
      }
    }
  }

  return post
}

export async function clientAction(_: ClientActionFunctionArgs) {
  const { action, postId } = zx.parseParams(_.params, postActionSchema)

  queryClient.setQueriesData<
    | {
        pages: {
          posts: PostCardModel[]
          shouldRefresh: boolean
          isRebuilding: boolean
          nextCursor: string | undefined
        }[]
        pageParams: (string | undefined)[]
      }
    | undefined
  >(['feed'], (old) => {
    if (!old) return undefined

    return {
      pages: old.pages.map((page) => {
        return {
          ...page,
          posts: page.posts.map((post) => {
            if (post.id !== postId) {
              return post
            }

            return updatePost(post, action)
          }),
        }
      }),
      pageParams: old.pageParams,
    }
  })

  return await _.serverAction()
}

export function usePostActionSubmit() {
  return useCallback(
    (postId: string, authorId: string, action: PostActionType) => {
      fetch(
        `/api/post/${postId}/${authorId}/action/${encodeURIComponent(
          action
        )}?_data=routes/api.post.$postId.action.$action`,
        {
          method: 'POST',
        }
      )
    },
    []
  )
}
