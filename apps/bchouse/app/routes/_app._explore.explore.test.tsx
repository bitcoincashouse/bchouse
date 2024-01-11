import { createRemixStub } from '@remix-run/testing'
import { render, screen, waitFor } from '@testing-library/react'
// import { typedjson } from 'remix-typedjson'
import { beforeEach, describe, it, vi } from 'vitest'
// import { default as ExplorePageIndex } from "./_app._explore"
import { Outlet } from '@remix-run/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { PostCardModel } from '~/components/post/types'
import { UserPopoverProvider } from '~/components/user-popover'
import { default as ExplorePage } from './_app._explore.explore'

vi.mock('@clerk/clerk-react')

describe('explore', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    vi.mock('@clerk/clerk-react')
  })

  it('No search results', async () => {
    const Component = createRemixStub([
      {
        Component: () => <Outlet />,
        loader: async (args) => {
          return {}
        },
        action: () => null,
        handle: {
          id: 'layout',
        },
        children: [
          {
            path: '/explore',
            Component: ExplorePage,
            action: () => null,
            loader: () => {
              return {}
            },
          },
        ],
      },
    ])

    render(<Component initialEntries={['/explore']} />)
    await waitFor(() => screen.getByText('No search results'))
  })

  it('Show post content', async () => {
    const Component = createRemixStub([
      {
        Component: () => <Outlet />,
        loader: async (args) => {
          return {
            profile: {
              id: '',
            },
          }
        },
        action: () => null,
        handle: {
          id: 'layout',
        },
        children: [
          {
            path: '/explore',
            Component: ExplorePage,
            action: () => null,
            loader: () => {
              return [
                {
                  id: '',
                  content: {
                    content: [
                      {
                        content: [
                          {
                            type: 'text',
                            text: 'My content',
                          },
                        ],
                        type: 'paragraph',
                      },
                    ],
                    type: 'doc',
                  },
                  date: '',
                  deleted: false,
                  isThread: false,
                  key: '',
                  likeCount: 0,
                  mediaUrls: [],
                  person: {
                    handle: '',
                    href: '',
                    name: '',
                    bchAddress: '',
                    network: 'chipnet',
                  },
                  publishedById: '',
                  quoteCount: 0,
                  replyCount: 0,
                  repostCount: 0,
                  tipAmount: 0,
                  type: 'POST',
                  viewCount: 0,
                  wasLiked: true,
                  wasReposted: true,
                  wasTipped: true,
                  avatarUrl: '',
                  campaignId: null,
                  embed: null,
                  monetization: undefined,
                  parentPost: null,
                  repostedBy: undefined,
                  repostedById: undefined,
                },
              ] as Array<PostCardModel>
            },
          },
        ],
      },
    ])

    const queryClient = new QueryClient()

    render(
      <UserPopoverProvider>
        <QueryClientProvider client={queryClient}>
          <Component initialEntries={['/explore']} />
        </QueryClientProvider>
      </UserPopoverProvider>
    )
    await waitFor(() => screen.getByText('My content'))
  })
})
