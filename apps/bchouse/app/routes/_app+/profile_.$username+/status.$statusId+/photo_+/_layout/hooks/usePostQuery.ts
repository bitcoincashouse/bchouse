import { LoaderFunctionArgs } from '@remix-run/node'
import { useParams } from '@remix-run/react'
import { $preload, $useLoaderQuery } from 'remix-query'

export function preloadPostQuery(_: LoaderFunctionArgs, statusId: string) {
  return $preload(_, '/api/post/status/:statusId', { statusId })
}

export const usePostQuery = () => {
  const { statusId } = useParams<{
    username: string
    statusId: string
    index: string
  }>()

  return $useLoaderQuery('/api/post/status/:statusId', {
    params: {
      statusId: statusId!,
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    enabled: !!statusId,
    select(data) {
      return {
        ...data,
        mainPost: data.posts.find((post) => post.id === statusId),
      }
    },
  })
}
