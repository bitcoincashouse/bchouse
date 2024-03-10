import { Link } from '@remix-run/react'
import { $path } from 'remix-routes'
import { usePost } from './context'
import { UserPopoverLink } from './user-popover-link'

export function PostCardHeader() {
  const item = usePost()

  return (
    <div className="text-[15px]">
      <UserPopoverLink id={item.publishedById} as={'span'}>
        <Link
          to={$path('/profile/:username', {
            username: item.person.handle,
          })}
          className="font-bold text-primary-text hover:underline"
        >
          {item.person.name}
        </Link>
      </UserPopoverLink>{' '}
      <UserPopoverLink id={item.publishedById} as={'span'}>
        <Link
          className="text-sm text-secondary-text"
          to={$path('/profile/:username', {
            username: item.person.handle,
          })}
        >
          @{item.person.handle}
        </Link>
      </UserPopoverLink>{' '}
      <span className="before:content-['\2022'] text-secondary-text" />{' '}
      <span className="text-sm text-secondary-text">{item.date}</span>
    </div>
  )
}
