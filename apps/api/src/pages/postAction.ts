import { z } from 'zod'
import { PostCardModel } from '~/types'

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

  if (action === 'post:remove') {
    return posts.filter((post) => post.id !== postId)
  }

  if (
    action === 'repost:add' ||
    action === 'repost:remove' ||
    action === 'like:add' ||
    action === 'like:remove'
  ) {
    return posts.map((post) => {
      if (post.id !== postId) return post

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

export async function optimisticUpdate(
  params: z.infer<typeof postActionSchema>
) {
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

  const queryClient = window.queryClient

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
