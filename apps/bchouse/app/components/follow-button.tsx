import { UserMinusIcon, UserPlusIcon } from '@heroicons/react/24/outline'
import { useLocation, useNavigate, useRevalidator } from '@remix-run/react'
import { useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { $path } from 'remix-routes'
import { useTypedFetcher } from 'remix-typedjson'
import { useLayoutLoaderData } from '~/routes/_app/route'
import { action as followAction } from '~/routes/api.follow'
import { trpc } from '~/utils/trpc'
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

  const queryClient = useQueryClient()
  const { anonymousView } = useLayoutLoaderData()
  const [isHovering, setHover] = useState(false)
  const trpcClientUtils = trpc.useUtils()

  const { mutate: update, isPending: isSubmitting } =
    trpc.updateFollow.useMutation({
      onMutate: (variables) => {
        //TODO: Optimistically update follow/unfollow globally for user
        trpcClientUtils.isFollowing.setData(
          { profileId: variables.profileId },
          variables.action === 'follow'
        )
      },
      onSuccess: () => {
        revalidator.revalidate()
        //Invalidate user profile card for user
        queryClient.invalidateQueries({ queryKey: ['feed', 'home'] })
      },
    })

  //TODO: pass in isFollowing so context can handle optimistic updates
  //TODO: have global onMutate/onSuccess/onFailure for all related queries dealing with follow/unfollow status of particular user
  const isFollowing = trpc.isFollowing.useQuery(
    {
      profileId: user.id,
    },
    {
      staleTime: 5 * 60 * 1000,
      gcTime: 15 * 60 * 1000,
      //TODO: enable if logged in, otherwise, set initial to false.
      enabled: true,
      //TODO: if not logged in, set initial to false, otherwise, set initial to undefined.
      initialData: false ? false : undefined,
    }
  )

  return (
    <>
      {!user.isCurrentUser ? (
        <form
          onSubmit={() =>
            update({
              action: !isFollowing ? 'follow' : 'unfollow',
              profileId: user.id,
            })
          }
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
          <div
            onMouseOver={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
          >
            <button
              type="submit"
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
        </form>
      ) : null}
    </>
  )
}
