import { NavLink } from '@remix-run/react'
import { classNames } from '~/utils/classNames'
// import { QRCode, QRSvg } from 'sexy-qr'
// import QRCode from 'qrcode-svg'

const tabs = [
  { name: 'Posts', href: '' },
  { name: 'Replies', href: 'replies' },
  { name: 'Media', href: 'media' },
  { name: 'Likes', href: 'likes' },
  { name: 'Campaigns', href: 'campaigns' },
]

export function Tabs() {
  return (
    <nav
      className={classNames('flex justify-around space-x-8 flex-1')}
      aria-label="Tabs"
    >
      {tabs.map((tab, i) => {
        return (
          <NavLink
            key={tab.name}
            to={tab.href}
            end
            replace={true}
            preventScrollReset={true}
            className={({ isActive }) =>
              classNames(
                isActive
                  ? 'border-pink-500 text-primary-text'
                  : 'border-transparent text-secondary-text hover:border-gray-300 hover:dark:text-secondary-text',
                'whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium'
              )
            }
          >
            {tab.name}
          </NavLink>
        )
      })}
    </nav>
  )
}
