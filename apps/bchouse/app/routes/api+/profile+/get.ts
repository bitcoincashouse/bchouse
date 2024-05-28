import { LoaderFunctionArgs } from '@remix-run/node'
import { profileService } from '~/.server/getContext'
import { getAuthOptional } from '~/utils/auth'

export const loader = async (_: LoaderFunctionArgs) => {
  //Applies to entire application
  // await ratelimit.limitByIp(_, 'app', true)
  const { userId } = await getAuthOptional(_)

  const profile = !!userId && (await profileService.getHomeProfile(userId))

  //TODO: Persist dismissed update profile (add to home profile return)
  const showUpdateProfile = profile && !profile.homeView.bchAddress && false

  if (!profile) {
    return {
      anonymousView: true,
    } as const
  } else {
    return {
      ...profile,
      anonymousView: false,
      showUpdateProfile,
    } as const
  }
}
