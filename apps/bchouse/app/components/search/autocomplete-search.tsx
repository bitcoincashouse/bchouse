import { useNavigate } from '@remix-run/react'
import { $path } from 'remix-routes'
import { ClientOnly } from '~/components/client-only'
import { classNames } from '~/utils/classNames'
import { typesenseClient } from '~/utils/typesense.client'
import { Autocomplete } from './autocomplete'
import { UserResult } from './user-result'

type UserIndexedRecord = {
  id: string
  user_username: string
  user_fullname: string
  user_avatarUrl: string
  user_createdAt: number
}

async function getResults(query: string) {
  const userResult = await typesenseClient
    .collections<UserIndexedRecord>('users')
    .documents()
    .search({
      query_by: 'user_username,user_fullname',
      q: query,
    })

  return (
    userResult.hits?.map((hit) => ({
      ...hit.document,
    })) ?? []
  )
}

type AutocompleteResult = Awaited<ReturnType<typeof getResults>>[number]

type SearchProps = {
  query?: string
}

export const Search: React.FC<SearchProps> = (props) => {
  return (
    <ClientOnly
      fallback={
        <div>
          <label htmlFor="search" className="sr-only">
            Search
          </label>
          <input
            type="text"
            disabled
            className="bg-gray-50 rounded-full w-full border-0"
          />
        </div>
      }
    >
      {() => <ClientSearch {...props} />}
    </ClientOnly>
  )
}

export const ClientSearch: React.FC<SearchProps> = ({ query = '' }) => {
  const navigate = useNavigate()

  return (
    <div className="bg-gray-50 rounded-full flex flex-col gap-2">
      <div className="w-full">
        <label htmlFor="search" className="sr-only">
          Search
        </label>
        <div className="relative text-gray-400 focus-within:text-gray-400">
          <Autocomplete<UserIndexedRecord>
            id="search"
            classNames={{
              root: classNames(
                'block w-full rounded-md border border-transparent py-2 pl-10 pr-3 leading-5',
                'focus:border-white focus:outline-none focus:ring-white',
                'bg-transparent placeholder-gray-500 text-primary-text sm:text-sm'
              ),
              form: '!bg-transparent !border-0 !shadow-none',
              submitButton: '[&>*]:!text-gray-400',
              detachedSearchButton: '!rounded-full',
              detachedSearchButtonPlaceholder: 'line-clamp-1',
            }}
            initialState={{ query }}
            placeholder="Search users and posts"
            openOnFocus={true}
            onSubmit={(params) =>
              navigate(
                $path('/explore', {
                  q: params.state.query,
                })
              )
            }
            getSources={({ query }) => {
              return [
                {
                  sourceId: 'posts',
                  getItems() {
                    return getResults(query)
                  },
                  onSelect({ item }) {
                    navigate(
                      $path('/profile/:username', {
                        username: item.user_username as string,
                      })
                    )
                  },
                  templates: {
                    item({ item, html }) {
                      return (
                        <UserResult
                          user={{
                            avatarUrl: item.user_avatarUrl,
                            id: item.id,
                            username: item.user_username,
                            fullName: item.user_fullname,
                            about: '',
                            bchAddress: '',
                            isCurrentUserFollowing: false,
                          }}
                          key={item.user_username}
                        ></UserResult>
                      )
                    },
                    noResults() {
                      return 'No results found.'
                    },
                  },
                },
              ]
            }}
          />
        </div>
      </div>
    </div>
  )
}
