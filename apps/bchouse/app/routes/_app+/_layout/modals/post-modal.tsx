import { useLocation, useSearchParams } from '@remix-run/react'
import { useMemo } from 'react'
import { $useLoaderQuery } from 'remix-query'
import { ClientOnly } from '~/components/client-only'
import { PostModal } from '~/components/post/form/implementations/post-modal'
import { Post } from '~/components/post/types'
import { useCloseCreatePostModal } from '~/utils/useCloseCreatePostModal'

export function ShowPostModal() {
  let {
    data: applicationData = {
      anonymousView: true,
    },
  } = $useLoaderQuery('/api/profile/get', {
    staleTime: 5 * 60 * 1000,
  })

  const [searchParams] = useSearchParams()
  const modalName = searchParams.get('modal')
  const replyToPost = useLocation().state?.replyToPost as Post
  const closePostModal = useCloseCreatePostModal()

  const showCreatePost = useMemo(() => {
    if (['create-post', 'reply'].indexOf(modalName as string) === -1) {
      return false
    }

    if (modalName === 'reply' && !replyToPost) {
      closePostModal()
      return false
    }

    return true
  }, [modalName, replyToPost])

  if (applicationData.anonymousView || !showCreatePost) {
    return null
  }

  const profile = applicationData.profile

  return (
    <ClientOnly>
      {() => (
        <PostModal
          isOpen={true}
          onClose={() => closePostModal()}
          user={profile}
          parentPost={replyToPost}
        />
      )}
    </ClientOnly>
  )
}
