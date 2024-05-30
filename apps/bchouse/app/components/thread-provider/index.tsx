import React from 'react'
import { PostCardModel } from '~/.server/services/types'

export type DonorPost = {
  anonymousName: string | null
  username: string | null
  firstName: string | null
  lastName: string | null
  avatarUrl: string | null
  comment: string
  pledgeAmount: bigint
  createdAt: Date
}

export type StatusThreadPosts = {
  ancestors: PostCardModel[]
  main: PostCardModel
  replies: PostCardModel[]
  all: PostCardModel[]
}

export type CampaignThreadPosts = StatusThreadPosts & {
  donors: DonorPost[]
}

export type Thread =
  | {
      isCampaign: false
      posts: StatusThreadPosts
    }
  | {
      isCampaign: true
      posts: CampaignThreadPosts
    }

const ThreadContext = React.createContext<Thread | null>(null)

export function ThreadProvider({
  main,
  ancestors,
  replies,
  children,
}: {
  ancestors: PostCardModel[]
  main: PostCardModel
  replies: PostCardModel[]
  children?: React.ReactNode
}) {
  const posts = React.useMemo(() => {
    return {
      isCampaign: false as const,
      posts: {
        main: main,
        ancestors: ancestors,
        replies: replies,
        all: [...ancestors, main, ...replies],
      },
    }
  }, [main, ancestors, replies])

  return (
    <ThreadContext.Provider value={posts}>{children}</ThreadContext.Provider>
  )
}

export function useStatusThread() {
  const ctx = React.useContext(ThreadContext)

  if (ctx === null) {
    throw new Error(
      'useStatusThread: useThread must be used in a child of ThreadProvider'
    )
  }

  return ctx.posts as StatusThreadPosts
}

export function useCampaignThread() {
  const ctx = React.useContext(ThreadContext)

  if (ctx === null) {
    throw new Error(
      'useCampaignThread: useCampaignThread must be used in a child of ThreadProvider'
    )
  }

  if (!ctx.isCampaign) {
    throw new Error(
      'useCampaignThread: ThreadProvider supplied invalid campaign Thread'
    )
  }

  return ctx.posts
}
