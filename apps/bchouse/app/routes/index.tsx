import { LandingPage } from '~/components/landing'

export default function Index() {
  const isLoggedIn = typeof window !== 'undefined' && !!window.env.userId
  return <LandingPage isLoggedIn={isLoggedIn} />
}
