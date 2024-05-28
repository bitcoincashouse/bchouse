import { LoaderFunctionArgs } from '@remix-run/node'
import { z } from 'zod'
import { pledgeService } from '~/.server/getContext'
import { zx } from '~/utils/zodix'

const paramSchema = z.object({ secret: z.string() })

export const loader = async (_: LoaderFunctionArgs) => {
  const { secret } = zx.parseParams(_.params, paramSchema)

  const pledge = await pledgeService.getPledgeBySecret({ secret })

  return {
    ...pledge,
    satoshis: pledge.satoshis.toString(),
    forwardTx: pledge.forwardTx
      ? {
          ...pledge.forwardTx,
          pledgedAmount: pledge.forwardTx.pledgedAmount.toString(),
        }
      : null,
  }
}
