import {
  AuthObject,
  SignedInAuthObject,
  clerkClient,
} from '@clerk/clerk-sdk-node'

import { ApplicationError } from '@bchouse/utils'
import { getAuth } from '@clerk/remix/ssr.server'
import { DataFunctionArgs, redirect } from '@remix-run/node'
import {
  addUserInvite,
  createInviteCode,
  getInviteCode,
  getUserInviteCodeCount,
  getUserInviteCodes,
  getUserInviteCount,
  updateInvitedCode,
} from '../repositories/user/getUserInvites.js'
import { getUserIsAdmin } from '../repositories/user/getUserIsAdmin.js'

const MAX_INVITES = 10
export class AuthService {
  constructor() {}

  async getAuthOptional(params: DataFunctionArgs): Promise<AuthObject> {
    return await getAuth(params)
  }

  async getAuth(params: DataFunctionArgs): Promise<SignedInAuthObject> {
    const auth = await this.getAuthOptional(params)

    if (!auth || !auth.userId) {
      const redirectUrl = new URL(params.request.url)
      throw redirect(
        `/auth/login?redirectUrl=${encodeURI(redirectUrl.pathname)}`
      )
    }

    return auth
  }

  async getIsAdmin(params: DataFunctionArgs) {
    const auth = await this.getAuthOptional(params)
    return !!auth.userId && (await getUserIsAdmin({ userId: auth.userId }))
  }

  async createInviteCode({ userId }: { userId: string }) {
    const isAdmin = await getUserIsAdmin({ userId })
    const inviteCount = isAdmin ? 0 : await getUserInviteCodeCount({ userId })

    if (inviteCount >= MAX_INVITES) {
      throw new ApplicationError([
        {
          code: 'too_many_invites',
          longMessage: `User has invited already invited ${MAX_INVITES} users`,
          message: `User has invited already invited ${MAX_INVITES} users`,
          meta: {},
        },
      ])
    }

    return await createInviteCode({
      userId,
    })
  }

  async getInviteCodes({ userId }: { userId: string }) {
    const [isAdmin, inviteCodes] = await Promise.all([
      getUserIsAdmin({ userId }),
      getUserInviteCodes({ userId }),
    ])

    return {
      inviteCodes,
      allowedCodes: MAX_INVITES,
      remainingCodes: Math.max(
        0,
        MAX_INVITES - (isAdmin ? 0 : inviteCodes.length)
      ),
    }
  }

  async getInviteCode({ code }: { code: string }) {
    return getInviteCode({ code })
  }

  async claimInviteCode({
    code,
    emailAddress,
  }: {
    code: string
    emailAddress: string
  }) {
    const invitation = await getInviteCode({ code })

    if (!invitation || invitation.claimedEmailAddress) {
      throw new ApplicationError([
        {
          code: 'invite_claimed',
          longMessage: `Invitation is already claimed`,
          message: `Invitation is already claimed`,
          meta: {},
        },
      ])
    }

    await clerkClient.allowlistIdentifiers.createAllowlistIdentifier({
      identifier: emailAddress,
      notify: true,
    })

    await updateInvitedCode({
      code,
      emailAddress,
    })
  }

  async getAllowedInviteCount({ userId }: { userId: string }) {
    const inviteCount = await getUserInviteCount({ userId })
    return Math.max(0, MAX_INVITES - inviteCount)
  }

  async sendInvite({
    userId,
    emailAddress,
  }: {
    userId: string
    emailAddress: string
  }) {
    const inviteCount = await getUserInviteCount({ userId })

    if (inviteCount >= MAX_INVITES) {
      throw new ApplicationError([
        {
          code: 'too_many_invites',
          longMessage: `User has invited already invited ${MAX_INVITES} users`,
          message: `User has invited already invited ${MAX_INVITES} users`,
          meta: {},
        },
      ])
    }

    await clerkClient.allowlistIdentifiers.createAllowlistIdentifier({
      identifier: emailAddress,
      notify: true,
    })

    await addUserInvite({
      userId,
      emailAddress,
    })
  }

  async forceLogout(params: SignedInAuthObject) {
    try {
      await clerkClient.sessions.revokeSession(params.sessionId)
    } catch (err) {}
  }
}
