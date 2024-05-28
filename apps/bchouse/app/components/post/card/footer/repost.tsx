/* eslint-disable react/display-name */
import { ArrowPathRoundedSquareIcon } from '@heroicons/react/24/outline'
import { useQueryClient } from '@tanstack/react-query'
// import { HtmlPortalNode, OutPortal } from 'react-reverse-portal'
import { $useActionMutation, $useUtils } from 'remix-query'
import { PostCardModel } from '~/components/post/types'
import { useAuthGuardCheck } from '~/components/utils/useAuthGuardCheck'
import { classNames } from '~/utils/classNames'

export function RepostButton({ item }: { item: PostCardModel }) {
  const checkAuth = useAuthGuardCheck()
  //TODO: optimistic update
  const queryClient = useQueryClient()
  const toggled = item.wasReposted
  const count = item.repostCount
  const action = toggled ? 'repost:remove' : 'repost:add'
  const utils = $useUtils()
  const mutation = $useActionMutation('/api/post/action', {
    onMutate(variables) {
      const isAddRepost = variables.action == 'repost:add'

      utils.setData(
        '/api/post/get/:postId',
        { postId: item.id },
        {
          ...item,
          wasReposted: isAddRepost,
          repostCount: Math.max(item.repostCount + (isAddRepost ? 1 : -1), 0),
        }
      )
    },
    onSuccess(variables) {},
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
          toggled ? 'text-emerald-600' : ''
        )}
        title={toggled ? 'Unrepost' : 'Repost'}
      >
        <ArrowPathRoundedSquareIcon
          title={toggled ? 'Unrepost' : 'Repost'}
          className="w-5 h-5 flex items-center group-hover:ring-8 group-hover:bg-emerald-600/20 group-hover:ring-emerald-600/20 transition-all ease-in-out duration-300 rounded-full"
        />
        <span>{count}</span>
      </button>
    </form>
  )
}
