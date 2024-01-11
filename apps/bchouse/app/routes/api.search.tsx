import { LoaderArgs, json } from '@remix-run/node'
import { z } from 'zod'
import { zx } from '~/utils/zodix'

export const loader = async (_: LoaderArgs) => {
  const { q = '' } = zx.parseQuery(_.request, {
    q: z.string().optional(),
  })

  return json(await _.context.searchService.searchPosts(q), {
    headers: {
      'Content-Type': 'application/json',
    },
  })
}
