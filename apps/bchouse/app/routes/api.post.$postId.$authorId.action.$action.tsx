import { PostActionType } from '@bchouse/api/src/pages/postAction'
import { useSubmit } from '@remix-run/react'
import { useCallback } from 'react'
import { $path } from 'remix-routes'

export function usePostActionSubmit() {
  const submit = useSubmit()

  return useCallback(
    (postId: string, authorId: string, action: PostActionType) => {
      submit(null, {
        //TODO: trpc.postAction
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
