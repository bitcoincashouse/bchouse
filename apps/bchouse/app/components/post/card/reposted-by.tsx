import { ArrowPathIcon } from '@heroicons/react/20/solid'
import { Link } from '@remix-run/react'
import { $path } from 'remix-routes'
import { CurrentUser } from '~/components/context/current-user-context'
import { PostCardModel } from '../types'

export function RepostedBy({
  item,
  currentUser,
}: {
  item: PostCardModel
  currentUser: CurrentUser
}) {
  return (
    <>
      {!!item.repostedBy && (
        <Link
          to={$path('/profile/:username', {
            username: item.repostedBy,
          })}
          onClick={(e) => e.stopPropagation()}
          className="hover:underline absolute -top-6 font-semibold inline-flex flex-row gap-2 text-sm text-gray-400 items-center"
        >
          <ArrowPathIcon className="absolute -left-5 w-5 h-5" />{' '}
          <span className="ml-1">
            {!currentUser.isAnonymous &&
            item.repostedBy === currentUser.username
              ? 'You'
              : item.repostedBy}{' '}
            <span className="">Retweeted</span>
          </span>
        </Link>
      )}
    </>
  )
}
