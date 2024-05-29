import { Link, useLocation } from '@remix-run/react'
import { useCurrentUser } from '~/components/context/current-user-context'

export function PostButton() {
  const location = useLocation()
  const currentUser = useCurrentUser()
  const pathParts = location.pathname.split('/')
  const hidePostButton =
    currentUser.isAnonymous ||
    (pathParts.indexOf('profile') !== -1 && pathParts.indexOf('status') !== -1)

  return !hidePostButton ? (
    <div className="sm:hidden fixed bottom-20 right-8">
      <div className="flex justify-center">
        <Link
          to={{ search: '?modal=create-post' }}
          replace={true}
          preventScrollReset={true}
          type="button"
          className="min-h-[60px] min-w-[60px] text-center inline-flex items-center justify-center rounded-full w-full bg-primary-btn-400 tracking-wide px-4 py-2.5 text-base font-semibold text-white shadow-sm hover:bg-primary-btn-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-btn-600"
        >
          <span className="hidden xl:block">+</span>
          <div className="xl:hidden">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-6 h-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 4.5v15m7.5-7.5h-15"
              />
            </svg>
          </div>
        </Link>
      </div>
    </div>
  ) : null
}
