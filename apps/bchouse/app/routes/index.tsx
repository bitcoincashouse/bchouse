import { LoaderArgs } from '@remix-run/node'
import { useTypedLoaderData } from 'remix-typedjson'
import { LandingPage } from '~/components/landing'

export async function loader(_: LoaderArgs) {
  await _.context.ratelimit.limitByIp(_, 'app', true)
  const { userId } = await _.context.authService.getAuthOptional(_)
  return { isLoggedIn: !!userId }
}

export default function Index() {
  const { isLoggedIn } = useTypedLoaderData<typeof loader>()
  return <LandingPage isLoggedIn={isLoggedIn} />
}
