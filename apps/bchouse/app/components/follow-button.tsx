import { UserMinusIcon, UserPlusIcon } from '@heroicons/react/24/outline'
import { useLocation, useNavigate, useRevalidator } from '@remix-run/react'
import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'
import { $path } from 'remix-routes'
import { useTypedFetcher } from 'remix-typedjson'
import { useLayoutLoaderData } from '~/routes/_app/route'
import { action as followAction } from '~/routes/api.follow'
import { classnames } from './utils/classnames'

export function FollowButton({
  user,
  className,
}: {
  user: {
    id: string
    isCurrentUser: boolean
    isCurrentUserFollowing: boolean
  }
  className?: string
}) {
  const fetcher = useTypedFetcher<typeof followAction>({
    key: 'follow:' + user.id,
  })
  const revalidator = useRevalidator()
  const location = useLocation()
  const navigate = useNavigate()

  const isSubmittingFollowAction = fetcher.state !== 'idle'
  const isDoneSubmitting =
    !isSubmittingFollowAction && fetcher.data !== undefined

  const isFollowing = useMemo(() => {
    if (!isSubmittingFollowAction) {
      return !!user.isCurrentUserFollowing
    }

    if (fetcher.formAction?.indexOf('follow:add') !== -1) {
      return true
    }

    if (fetcher.formAction?.indexOf('follow:remove') !== -1) {
      return false
    }

    const data = fetcher.formData?.get('_action')
    return data === 'follow'
  }, [fetcher])

  const queryClient = useQueryClient()
  useEffect(() => {
    if (isDoneSubmitting) {
      revalidator.revalidate()
      //Invalidate user profile card for user
      queryClient.invalidateQueries({ queryKey: ['feed', 'home'] })
    }
  }, [isDoneSubmitting])

  const { anonymousView } = useLayoutLoaderData()
  const [isHovering, setHover] = useState(false)
  return (
    <>
      {!user.isCurrentUser ? (
        <fetcher.Form
          method="post"
          action={$path('/api/follow', {})}
          className="group"
          onClick={(e) => {
            e.stopPropagation()

            if (anonymousView) {
              e.preventDefault()
              navigate(
                $path(
                  '/auth/login/:rest?',
                  {},
                  {
                    redirectUrl: location.pathname,
                  }
                )
              )
            }
          }}
        >
          <input type="hidden" name="profileId" value={user.id} />
          <div
            onMouseOver={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
          >
            <button
              type="submit"
              name="_action"
              value={!isFollowing ? 'follow' : 'unfollow'}
              className={classnames(
                'inline-flex justify-center gap-x-1.5 rounded-md px-3 py-2 text-sm font-semibold shadow-sm ring-1 ring-inset',
                isFollowing && !isHovering && 'opacity-50',
                isFollowing && isHovering
                  ? 'text-rose-900 ring-rose-300 hover:bg-rose-50'
                  : 'text-primary-text ring-gray-300 hover:bg-hover',
                className
              )}
            >
              {!isFollowing || !isHovering ? (
                <UserPlusIcon
                  className="-ml-0.5 h-5 w-5 text-primary-text"
                  aria-hidden="true"
                />
              ) : (
                <UserMinusIcon
                  className="-ml-0.5 h-5 w-5 text-gray-400 group-hover:text-rose-900"
                  aria-hidden="true"
                />
              )}
              <span className="flex flex-col">
                <span className="inline-block !h-0 invisible">Following</span>
                {!isFollowing
                  ? 'Follow'
                  : !isHovering
                  ? 'Following'
                  : 'Unfollow'}
              </span>
            </button>
          </div>
        </fetcher.Form>
      ) : null}
    </>
  )
}
