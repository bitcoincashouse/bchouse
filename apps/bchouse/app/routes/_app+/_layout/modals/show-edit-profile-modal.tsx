import { useSearchParams } from '@remix-run/react'
import { $useLoaderQuery } from 'remix-query'
import { EditProfileModal } from '~/components/edit-profile-modal'
import { useCloseCreatePostModal } from '~/utils/useCloseCreatePostModal'

export function ShowEditProfileModal() {
  let {
    data: applicationData = {
      anonymousView: true,
    },
  } = $useLoaderQuery('/api/profile/get', {
    staleTime: 5 * 60 * 1000,
  })

  const closeEditProfileModal = useCloseCreatePostModal()
  const [searchParams] = useSearchParams()
  const modalName = searchParams.get('modal')

  if (
    applicationData.anonymousView ||
    (!applicationData.showOnBoarding && modalName !== 'edit-profile')
  ) {
    return null
  }

  return (
    <EditProfileModal
      open={true}
      closeModal={closeEditProfileModal}
      user={applicationData.homeView}
    />
  )
}
