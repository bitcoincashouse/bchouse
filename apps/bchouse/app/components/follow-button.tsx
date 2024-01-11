import { UserMinusIcon, UserPlusIcon } from '@heroicons/react/24/outline'
import { useLocation, useNavigate, useRevalidator } from '@remix-run/react'
import { useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { $path } from 'remix-routes'
import { useTypedFetcher } from 'remix-typedjson'
import { useLayoutLoaderData } from '~/routes/_app/route'
import { action as followAction } from '~/routes/api.follow'
import { classNames } from '~/utils/classNames'

export function FollowButton({
  user,
}: {
  user: {
    id: string
    isCurrentUser: boolean
    isCurrentUserFollowing: boolean
  }
}) {
  const fetcher = useTypedFetcher<typeof followAction>()
  const revalidator = useRevalidator()
  const location = useLocation()
  const navigate = useNavigate()

  const isSubmittingFollowAction = fetcher.state === 'submitting'
  const isDoneSubmitting =
    fetcher.state === 'idle' && fetcher.data !== undefined

  const queryClient = useQueryClient()
  useEffect(() => {
    if (isDoneSubmitting) {
      revalidator.revalidate()
      //Invalidate user profile card for user
      queryClient.invalidateQueries({ queryKey: ['feed', 'home'] })
    }
  }, [isDoneSubmitting])

  const { anonymousView } = useLayoutLoaderData()
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
          <button
            type="submit"
            name="_action"
            value="follow"
            disabled={
              !!user.isCurrentUserFollowing || !!isSubmittingFollowAction
            }
            className={classNames(
              user.isCurrentUserFollowing ? 'group-hover:hidden' : '',
              'disabled:opacity-50 inline-flex justify-center gap-x-1.5 rounded-md px-3 py-2 text-sm font-semibold text-primary-text shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-hover'
            )}
          >
            <UserPlusIcon
              className="-ml-0.5 h-5 w-5 text-primary-text"
              aria-hidden="true"
            />
            {!user.isCurrentUserFollowing ? 'Follow' : 'Following'}
          </button>
          {user.isCurrentUserFollowing && (
            <button
              type="submit"
              name="_action"
              value="unfollow"
              disabled={!!isSubmittingFollowAction}
              className={classNames(
                'hidden group-hover:inline-flex disabled:opacity-50 justify-center gap-x-1.5 rounded-md px-3 py-2 text-sm font-semibold text-rose-900 shadow-sm ring-1 ring-inset ring-rose-300 hover:bg-rose-50'
              )}
            >
              <UserMinusIcon
                className="-ml-0.5 h-5 w-5 text-gray-400 group-hover:text-rose-900"
                aria-hidden="true"
              />
              Unfollow
            </button>
          )}
        </fetcher.Form>
      ) : null}
    </>
  )
}
