import Layout from '~/components/layouts/layout'
import StarfieldHero from '~/components/starfield-hero'

import { SignInButton, SignUpButton } from '@clerk/remix'
import InfoAlert from '~/components/alert'
import { Navigation } from '~/components/home-navigation'
import GitlabIcon from '~/components/icons/GitlabIcon'
import MatrixIcon from '~/components/icons/MatrixIcon'
import TelegramIcon from '~/components/icons/TelegramIcon'
import { logoUrl } from '~/utils/constants'

const socialLinks = [
  {
    text: 'Gitlab',
    link: 'https://gitlab.com/ipfs-flipstarter',
    icon: GitlabIcon,
  },
  {
    text: 'Telegram',
    link: 'https://t.me/ipfs_flipstarters',
    icon: TelegramIcon,
  },
  {
    text: 'Matrix',
    link: 'https://matrix.to/#/#ipfs+flipstarters:matrix.org',
    icon: MatrixIcon,
  },
]

export function LandingPage({ isLoggedIn }: { isLoggedIn: boolean }) {
  return (
    <Layout
      title={`BCHouse`}
      description="BCH meets social networking"
      wrapperClassName="homepage"
    >
      <div className="bg-[#0a4f76] relative z-40">
        <Navigation
          logoUrl={logoUrl}
          hideBorder={true}
          hideSearch={true}
          isLoggedIn={isLoggedIn}
        />
      </div>
      <InfoAlert
        className="sticky inset-x-0 top-0 z-40 lg:text-center"
        target="_blank"
        href="https://twitter.com/@nyonecanpay"
      >
        This is in development preview mode! Signups are invite-only and users
        can only create testnet campaigns.
      </InfoAlert>
      <StarfieldHero
        title={
          <div className="tracking-wide">
            Social networking and crowdfunding with{' '}
            <span className="font-semibold tracking-normal text-green-400">
              BitcoinCash
            </span>
          </div>
        }
      >
        <h2 className="text-center tracking-wide md:text-xl font-medium">
          Come and let's build!
        </h2>
        <div className="flex flex-row flex-wrap items-center justify-center mt-6 gap-2">
          <SignUpButton
            mode="modal"
            afterSignInUrl="/home"
            afterSignUpUrl="/auth/registration"
          >
            <button className="text-center rounded-lg hover:bg-blueGreenLight bg-blueGreen text-white button button--primary border-none button--lg px-8 py-3">
              Sign up
            </button>
          </SignUpButton>
          <SignInButton
            mode="modal"
            afterSignInUrl="/home"
            afterSignUpUrl="/auth/registration"
          >
            <button className="text-center rounded-lg hover:text-blueGreen hover:bg-gray-200 button text-blueGreen bg-white button--lg px-8 py-3">
              Sign in
            </button>
          </SignInButton>
        </div>
      </StarfieldHero>
    </Layout>
  )
}
