import { logger } from '@bchouse/utils'
import { ActionArgs, json } from '@remix-run/node'
import { useMemo } from 'react'
import { useTypedFetcher } from 'remix-typedjson'
import { getUpdateProfileSession } from '~/utils/updateProfileBannerCookie.server'

export const action = async (_: ActionArgs) => {
  try {
    const session = await getUpdateProfileSession(_.request)
    session.setDismissed()

    return json(true, {
      headers: {
        'Set-Cookie': await session.commit(),
      },
    })
  } catch (err) {
    logger.error(err)
    throw err
  }
}

export function useDismissUpdateProfileBanner() {
  const fetcher = useTypedFetcher<typeof action>()

  return useMemo(() => {
    return {
      submit: () =>
        fetcher.submit(
          {},
          {
            action: '/api/dismissUpdateProfileBanner',
            method: 'POST',
            preventScrollReset: true,
          }
        ),
    }
  }, [fetcher])
}
