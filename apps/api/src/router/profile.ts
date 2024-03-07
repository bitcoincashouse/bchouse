import { logger } from '@bchouse/utils'
import { TRPCError } from '@trpc/server'
import { z } from 'zod'
import { publicProcedure, router } from '../trpc'

const updateFollowInput = z.object({
  action: z.enum(['follow', 'unfollow']),
  profileId: z.string().nonempty(),
})

const updateProfileInput = z
  .object({
    about: z.string().optional(),
    bchAddress: z.string().optional(),
    company: z.string().optional(),
    coverPhotoMediaId: z.string().optional(),
    location: z.string().optional(),
    title: z.string().optional(),
    website: z.string().optional(),
  })
  .strip()

export const profileRouter = router({
  get: publicProcedure.query(async (opts) => {
    //Applies to entire application
    // await opts.ctx.ratelimit.limitByIp(_, 'app', true)
    console.log('Salam profile')
    const { userId } = opts.ctx.auth

    const profile =
      !!userId && (await opts.ctx.profileService.getHomeProfile(userId))

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
  }),
  getPublicProfile: publicProcedure
    .input(z.object({ userId: z.string() }))
    .mutation(async (opts) => {
      // await opts.ctx.ratelimit.limitByIp(_, 'api', true)
      const { userId } = opts.input
      const { userId: currentUserId } = opts.ctx.auth

      if (!currentUserId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
        })
      }

      const user = await opts.ctx.profileService.getBasicProfileById(
        currentUserId,
        userId
      )

      return user
    }),
  getIsFollowing: publicProcedure
    .input(z.object({ profileId: z.string().nonempty() }))
    .query(async (opts) => {
      if (!opts.ctx.auth?.userId) {
        return false
      }

      const { userId } = opts.ctx.auth

      return await opts.ctx.profileService.getIsFollowing(
        userId,
        opts.input.profileId
      )
    }),
  updateLastActive: publicProcedure.mutation(async (opts) => {
    try {
      const { userId } = opts.ctx.auth

      if (userId) {
        logger.info('Updating last active', userId)
        await opts.ctx.userService.updateAccountActivity(userId)
      }

      return null
    } catch (err) {
      logger.error(err)
      throw err
    }
  }),
  updateFollow: publicProcedure
    .input(updateFollowInput)
    .mutation(async (opts) => {
      try {
        // await opts.ctx.ratelimit.limitByIp(_, 'api', true)

        if (!opts.ctx.auth?.userId) {
          throw new TRPCError({
            code: 'FORBIDDEN',
          })
        }

        const { userId, sessionId } = opts.ctx.auth
        const { action, profileId } = opts.input

        if (action === 'follow') {
          await opts.ctx.profileService.addUserFollow(
            userId,
            sessionId,
            profileId
          )
        } else {
          await opts.ctx.profileService.removeUserFollow(
            userId,
            sessionId,
            profileId
          )
        }

        return profileId
      } catch (err) {
        return { error: err }
      }
    }),
  updateProfile: publicProcedure
    .input(updateProfileInput)
    .mutation(async (opts) => {
      try {
        const { userId } = opts.ctx.auth

        if (!userId) {
          throw new TRPCError({
            code: 'FORBIDDEN',
          })
        }

        const body = opts.input

        const user = await opts.ctx.profileService.updateProfile(userId, body)
        return user
      } catch (err) {
        return { error: err }
      }
    }),
})
