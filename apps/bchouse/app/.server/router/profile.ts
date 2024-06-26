import { isApplicationError, isClerkError, logger } from '@bchouse/utils'
import { TRPCError, TRPCRouterRecord } from '@trpc/server'
import { z } from 'zod'
import {
  authService,
  profileService,
  userService,
} from '../services/getContext'
import { publicProcedure } from '../trpc'

const updateFollowInput = z.object({
  action: z.enum(['follow', 'unfollow']),
  profileId: z.string().nonempty(),
})

const updateProfileInput = z
  .object({
    about: z
      .string()
      .optional()
      .nullable()
      .transform((str) => str || undefined),
    bchAddress: z
      .string()
      .optional()
      .nullable()
      .transform((str) => str || undefined),
    company: z
      .string()
      .optional()
      .nullable()
      .transform((str) => str || undefined),
    coverPhotoMediaId: z
      .string()
      .optional()
      .nullable()
      .transform((str) => str || undefined),
    location: z
      .string()
      .optional()
      .nullable()
      .transform((str) => str || undefined),
    title: z
      .string()
      .optional()
      .nullable()
      .transform((str) => str || undefined),
    website: z
      .string()
      .optional()
      .nullable()
      .transform((str) => str || undefined),
  })
  .strip()

export const profileRouter = {
  get: publicProcedure.query(async (opts) => {
    //Applies to entire application
    // await ratelimit.limitByIp(_, 'app', true)
    const { userId } = opts.ctx.auth

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
  }),
  getPublicProfile: publicProcedure
    .input(
      z.object({ userId: z.string() }).or(z.object({ username: z.string() }))
    )
    .query(async (opts) => {
      // await ratelimit.limitByIp(_, 'api', true)
      const { userId: currentUserId } = opts.ctx.auth

      const user =
        (await 'userId') in opts.input
          ? profileService.getBasicProfileById(currentUserId, opts.input.userId)
          : profileService.getBasicProfile(currentUserId, opts.input.username)

      return user
    }),
  getIsFollowing: publicProcedure
    .input(z.object({ profileId: z.string().nonempty() }))
    .query(async (opts) => {
      if (!opts.ctx.auth?.userId) {
        return false
      }

      const { userId } = opts.ctx.auth

      return await profileService.getIsFollowing(userId, opts.input.profileId)
    }),
  updateLastActive: publicProcedure.mutation(async (opts) => {
    try {
      const { userId } = opts.ctx.auth

      if (userId) {
        logger.info('Updating last active', userId)
        await userService.updateAccountActivity(userId)
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
        // await ratelimit.limitByIp(_, 'api', true)

        if (!opts.ctx.auth?.userId) {
          throw new TRPCError({
            code: 'FORBIDDEN',
          })
        }

        const { userId, sessionId } = opts.ctx.auth
        const { action, profileId } = opts.input

        if (action === 'follow') {
          await profileService.addUserFollow(userId, sessionId, profileId)
        } else {
          await profileService.removeUserFollow(userId, sessionId, profileId)
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

        const user = await profileService.updateProfile(userId, body)
        return user
      } catch (err) {
        return { error: err }
      }
    }),
  listInviteCodes: publicProcedure.query(async (opts) => {
    const { userId } = opts.ctx.auth

    if (!userId) {
      throw new TRPCError({
        code: 'FORBIDDEN',
      })
    }

    const inviteCodes = await authService.getInviteCodes({
      userId,
    })

    return inviteCodes
  }),
  invite: publicProcedure.mutation(async (opts) => {
    try {
      const { userId } = await opts.ctx.auth

      if (!userId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
        })
      }

      const result = await authService.createInviteCode({
        userId,
      })

      return {
        error: false as const,
      }
    } catch (err) {
      if (isClerkError(err) && err.errors[0]) {
        return { error: true as const, message: err.errors[0].message }
      }

      if (isApplicationError(err) && err.errors[0]) {
        return { error: true as const, message: err.errors[0].message }
      }

      return {
        error: true as const,
        message: 'Error inviting user, please try again.',
      }
    }
  }),
  getNotifications: publicProcedure.query(async (opts) => {
    const { userId } = await opts.ctx.auth

    if (!userId) {
      throw new TRPCError({
        code: 'FORBIDDEN',
      })
    }

    const notifications = await userService.getNotifications(userId)

    return {
      notifications,
    }
  }),
  getMentionNotifications: publicProcedure.query(async (opts) => {
    const { userId } = await opts.ctx.auth

    if (!userId) {
      throw new TRPCError({
        code: 'FORBIDDEN',
      })
    }

    const notifications = await userService.getMentions(userId)

    return {
      notifications,
    }
  }),
  updateLastViewedNotifications: publicProcedure.mutation(async (opts) => {
    const { userId } = await opts.ctx.auth

    if (!userId) {
      throw new TRPCError({
        code: 'FORBIDDEN',
      })
    }

    const updated = await userService.updateLastViewedNotifications(userId)

    return updated
  }),
  listFollowers: publicProcedure
    .input(z.object({ username: z.string() }))
    .query(async (opts) => {
      const { userId } = await opts.ctx.auth

      if (!userId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
        })
      }

      const { username } = opts.input
      return await profileService.getFollowers(userId, username)
    }),
  listFollowing: publicProcedure
    .input(z.object({ username: z.string() }))
    .query(async (opts) => {
      const { userId } = opts.ctx.auth

      if (!userId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
        })
      }

      const { username } = opts.input
      return await profileService.getFollowing(userId, username)
    }),
  getInvite: publicProcedure
    .input(z.object({ code: z.string().optional() }))
    .query(async (opts) => {
      // await _.context.ratelimit.limitByIp(_, 'api', true)

      const { code } = opts.input

      const invitationInfo = code
        ? await authService.getInviteCode({
            code,
          })
        : null

      if (!invitationInfo) {
        return null
      }

      return {
        code: invitationInfo.code,
        invitationFrom: invitationInfo.name,
      }
    }),
  claimInvite: publicProcedure
    .input(
      z.object({
        emailAddress: z.string().email(),
        code: z.string(),
      })
    )
    .mutation(async (opts) => {
      try {
        const { emailAddress, code } = opts.input

        const result = await authService.claimInviteCode({
          code,
          emailAddress,
        })

        return {
          error: false as const,
          emailAddress: emailAddress,
        }
      } catch (err) {
        logger.error('Error inviting user', err)

        if (isClerkError(err) && err.errors[0]) {
          if (err.errors[0].message === 'duplicate allowlist identifier') {
            return {
              error: true as const,
              message: 'Email already invited',
            }
          }

          return { error: true as const, message: err.errors[0].message }
        }

        if (isApplicationError(err) && err.errors[0]) {
          return { error: true as const, message: err.errors[0].message }
        }

        return {
          error: true as const,
          message: 'Error inviting user, please try again.',
        }
      }
    }),
} satisfies TRPCRouterRecord
