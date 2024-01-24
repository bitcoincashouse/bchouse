import { ActionArgs } from '@remix-run/node'
import { ClientActionFunctionArgs, useSubmit } from '@remix-run/react'
import { useCallback } from 'react'
import { $path } from 'remix-routes'
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
  } else if (action === 'mute:add') {
    await _.context.userService.addMute(userId, authorId)
  } else if (action === 'mute:remove') {
    await _.context.userService.removeMute(userId, authorId)
  } else if (action === 'block:add') {
    await _.context.userService.addBlock(userId, authorId)
  } else if (action === 'block:remove') {
    await _.context.userService.removeBlock(userId, authorId)
  } else if (action === 'follow:add') {
    await _.context.profileService.addUserFollow(userId, authorId)
  } else if (action === 'follow:remove') {
    await _.context.profileService.removeUserFollow(userId, authorId)
  }

  return typedjson({})
}

function updatePost(
  post: PostCardModel,
  action: z.infer<typeof postActionSchema>['action']
) {
  return post
}

type FeedData =
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

function updatePage(
  type: string,
  posts: PostCardModel[],
  params: z.infer<typeof postActionSchema>
) {
  const { action, postId, authorId } = params

  if (action === 'follow:add' || action === 'follow:remove') {
    //handle unfollow by removing posts
    //  do not immediately return to set isfollowing for reposts of user by other users
    if (type === 'home' && action === 'follow:remove') {
      posts = posts.filter(
        (post) =>
          //remove users posts unless reposted by someone else
          (post.publishedById !== authorId ||
            (!!post.repostedById && post.repostedById !== authorId)) &&
          //remove users reposts
          post.repostedById !== authorId
      )
    }

    //handle setting isFollowed if adding or removing follow on any page
    return posts.map((post) => {
      if (post.publishedById === authorId) {
        return {
          ...post,
          isFollowed: action === 'follow:add',
        }
      }

      return post
    })
  }

  if (action === 'block:add') {
    return posts.filter(
      (post) =>
        post.publishedById !== authorId && post.repostedById !== authorId
    )
  }

  if (action === 'mute:add' || action === 'mute:remove') {
    if (
      action === 'mute:add' &&
      (type === 'home' || type === 'all_posts' || type === 'all_campaigns')
    ) {
      //mute both posts and reposts on homepage (no need for button change)
      return posts.filter(
        (post) =>
          post.publishedById !== authorId && post.repostedById !== authorId
      )
    }

    return posts.map((post) => {
      if (post.publishedById === authorId) {
        return {
          ...post,
          isMuted: action === 'mute:add',
        }
      }

      return post
    })
  }

  if (
    action === 'repost:add' ||
    action === 'repost:remove' ||
    action === 'like:add' ||
    action === 'like:remove'
  ) {
    return posts.map((post) => {
      if (post.id !== params.postId) return post

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
    })
  }

  return posts
}

export async function clientAction(_: ClientActionFunctionArgs) {
  const params = zx.parseParams(_.params, postActionSchema)

  const updater = (type: string) => (old: FeedData) => {
    if (!old) return undefined

    const newResult = {
      pages: old.pages.map((page) => ({
        ...page,
        posts: updatePage(type, page.posts, params),
      })),
      pageParams: old.pageParams,
    }

    return newResult
  }

  queryClient.setQueriesData<FeedData>(['feed', 'home'], updater('home'))
  queryClient.setQueriesData<FeedData>(['feed', 'user'], updater('user'))
  queryClient.setQueriesData<FeedData>(
    ['feed', 'all_posts'],
    updater('all_posts')
  )
  queryClient.setQueriesData<FeedData>(
    ['feed', 'all_campaigns'],
    updater('all_campaigns')
  )

  const result = await _.serverAction()

  if (
    [
      'mute:add',
      'mute:remove',
      'block:add',
      'block:remove',
      'follow:add',
      'follow:remove',
    ].indexOf(params.action) !== -1
  ) {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: ['feed', 'home'],
        refetchType: 'all',
      }),
      queryClient.invalidateQueries({
        queryKey: ['feed'],
      }),
    ])
  }

  return result
}

export function usePostActionSubmit() {
  const submit = useSubmit()

  return useCallback(
    (postId: string, authorId: string, action: PostActionType) => {
      submit(null, {
        action: $path('/api/post/:postId/:authorId/action/:action', {
          action,
          authorId,
          postId,
        }),
        method: 'POST',
        navigate: false,
      })
    },
    []
  )
}
