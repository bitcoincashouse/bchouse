import { LoaderFunctionArgs } from '@remix-run/node'
import { typedjson } from 'remix-typedjson'
import z from 'zod'
import { campaignService } from '~/.server/getContext'
import { zx } from '~/utils/zodix'

const schema = z.object({
  username: z.string().optional(),
})

export type SearchParams = z.infer<typeof schema>

export async function loader(_: LoaderFunctionArgs) {
  // await opts.ctx.ratelimit.limitByIp(_, 'api', true)

  const { username } = zx.parseParams(_.params, schema)

  const activeCampaigns = await campaignService.getActiveCampaigns({
    limit: 2,
    username,
  })

  return typedjson(
    activeCampaigns.map((c) => ({
      id: c.id,
      title: c.title,
      expires: c.expires,
      goal: Number(c.goal || 0),
      raised: Number(c.raised || 0),
      pledges: Number(c.pledges || 0),
      username: c.username,
      statusId: c.statusId,
    }))
  )
}
