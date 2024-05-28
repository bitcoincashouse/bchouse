import { LoaderFunctionArgs } from '@remix-run/node'
import { z } from 'zod'
import { searchService } from '~/.server/getContext'
import { zx } from '~/utils/zodix'

const paramSchema = z.object({ q: z.string().optional() })

export const loader = async (_: LoaderFunctionArgs) => {
  // await ratelimit.limitByIp(_, 'api', true, 'search')

  const { q = '' } = zx.parseParams(_.params, paramSchema)
  return await searchService.searchPosts(q)
}
