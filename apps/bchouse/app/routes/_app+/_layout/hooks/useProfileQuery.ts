import { $useLoaderQuery } from 'remix-query'
import { CurrentUser } from '~/components/context/current-user-context'

const anonymousUser: CurrentUser = {
  isAnonymous: true,
}
export function useProfileQuery(): CurrentUser {
  const { data } = $useLoaderQuery('/api/profile/get', {
    staleTime: 5 * 60 * 1000,
    placeholderData: {
      anonymousView: true,
    },
    select(data): CurrentUser {
      return !data || !!data.anonymousView
        ? anonymousUser
        : {
            isAnonymous: false,
            isAdmin: data.profile.isAdmin,
            avatarUrl: data.profile.avatarUrl,
            fullName: data.profile.fullName,
            id: data.profile.id,
            username: data.profile.username,
            notificationCount: data.profile.notificationCount,
            bchAddress: data.homeView.bchAddress,
            showUpdateProfile: data.showUpdateProfile,
          }
    },
  })

  return data || anonymousUser
}
