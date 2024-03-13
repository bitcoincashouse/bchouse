import { router } from '../trpc'
import { campaignRouter } from './campaign'
import { metricsRouter } from './metrics'
import { moderationRouter } from './moderation'
import { postRouter } from './post'
import { profileRouter } from './profile'
import { searchRouter } from './search'

export const appRouter = router({
  search: searchRouter,
  campaign: campaignRouter,
  metrics: metricsRouter,
  moderation: moderationRouter,
  post: postRouter,
  profile: profileRouter,
})
