import { LoaderFunctionArgs } from '@remix-run/node'
import { useTypedLoaderData } from 'remix-typedjson'
import { LandingPage } from '~/components/landing'
import { getAuthOptional } from '~/utils/auth'

export async function loader(_: LoaderFunctionArgs) {
  // await _.context.ratelimit.limitByIp(_, 'app', true)
  const { userId } = await getAuthOptional(_)
  return { isLoggedIn: !!userId }
}

export default function Index() {
  const { isLoggedIn } = useTypedLoaderData<typeof loader>()
  return <LandingPage isLoggedIn={isLoggedIn} />
}
