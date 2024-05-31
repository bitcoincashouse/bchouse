/* eslint-disable react/display-name */
import { useMemo } from 'react'
import { $useUtils } from 'remix-query'
import { PostCardModel } from '../types'

export function useOptimisticPost(post: PostCardModel) {
  const queryClient = $useUtils()

  //Combine values returned via feed but not found via getPostById (ex. repostedBy)
  const item = useMemo(() => {
    const data = queryClient.getData('/api/post/get/:postId', {
      postId: post.id,
    })

    return data ? { ...post, ...data, repostedBy: post.repostedBy } : post
  }, [post])

  return item
}
