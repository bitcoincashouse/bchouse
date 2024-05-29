import { LoaderFunctionArgs } from '@remix-run/node'
// import { z } from 'zod'
import { pledgeService } from '~/.server/getContext'
import { getAuthRequired } from '~/utils/auth'
// import { zx } from '~/utils/zodix'

export const loader = async (_: LoaderFunctionArgs) => {
  // const { secret } = zx.parseParams(_.params, paramSchema)
  const { userId } = await getAuthRequired(_)

  // const pledgeSession = await getPledgeSession(_.request)
  // const pledgeSecrets = pledgeSession.getPledgeSecrets()

  const pledges = await pledgeService.getPledges({
    userId,
    pledgeSecrets: [],
  })

  const serializedPledges = pledges.map((pledge) => ({
    ...pledge,
    satoshis: pledge.satoshis.toString(),
    forwardTx: pledge.forwardTx
      ? {
          ...pledge.forwardTx,
          satoshis: pledge.forwardTx.satoshis.toString(),
          pledgedAmount: pledge.forwardTx.pledgedAmount.toString(),
        }
      : null,
  }))

  return serializedPledges
}
