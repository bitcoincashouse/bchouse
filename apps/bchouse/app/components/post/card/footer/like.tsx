/* eslint-disable react/display-name */
import { HeartIcon } from '@heroicons/react/24/outline'
import { useQueryClient } from '@tanstack/react-query'
import { trpc } from '~/utils/trpc'
// import { HtmlPortalNode, OutPortal } from 'react-reverse-portal'
import { PostCardModel } from '~/components/post/types'
import { useAuthGuardCheck } from '~/components/utils/useAuthGuardCheck'
import { classNames } from '~/utils/classNames'

export function LikeButton({ item }: { item: PostCardModel }) {
  const checkAuth = useAuthGuardCheck()

  //TODO: optimistic update
  const queryClient = useQueryClient()
  const toggled = item.wasLiked
  const count = item.likeCount
  const action = toggled ? 'like:remove' : 'like:add'
  const utils = trpc.useUtils()
  const mutation = trpc.post.postAction.useMutation({
    onMutate(variables) {
      const isAddLike = variables.action == 'like:add'
      utils.post.getPost.setData(
        { postId: item.id },
        {
          ...item,
          wasLiked: isAddLike,
          likeCount: Math.max(item.likeCount + (isAddLike ? 1 : -1), 0),
        }
      )
    },
    onSuccess(variables) {
      //TODO: update that specific post
      // invalidateFeed(queryClient, item.id)
    },
    onError(variables) {},
    onSettled(variables) {},
  })

  return (
    <form
      className="flex items-center"
      method="POST"
      onSubmit={(e) => {
        e.preventDefault()

        checkAuth(e)

        mutation.mutate({
          postId: item.id,
          authorId: item.publishedById,
          action,
        })
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <button
        type="submit"
        className={classNames(
          'inline-flex gap-1 items-center cursor-pointer group',
          toggled ? 'text-rose-600' : ''
        )}
        title={toggled ? 'Unlike' : 'Like'}
      >
        <HeartIcon
          title={toggled ? 'Unlike' : 'Like'}
          className={classNames(
            'w-5 h-5 flex items-center group-hover:ring-8 group-hover:bg-rose-600/20 group-hover:ring-rose-600/20 transition-all ease-in-out duration-300 rounded-full',
            toggled && 'fill-rose-600'
          )}
        />
        <span>{count}</span>
      </button>
    </form>
  )
}
