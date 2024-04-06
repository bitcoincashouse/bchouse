import { LandingPage } from '~/components/landing'
import { useHydrated } from '~/components/utils/use-hydrated'

export default function Index() {
  const isHydrated = useHydrated()
  const isLoggedIn =
    isHydrated && typeof window !== 'undefined' && !!window.env.userId
  return <LandingPage isLoggedIn={isLoggedIn} />
}
