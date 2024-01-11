import { UseDataFunctionReturn } from 'remix-typedjson'

export type FeedProps = {
  id: string
  feedOwner: {
    type?: 'user'
    avatarUrl: string | undefined
    isCurrentUser: boolean
    fullName?: string | undefined
    username: string
  }
}

export type FeedResponse = UseDataFunctionReturn<
  typeof import('~/routes/api.feed.$type.$id.($cursor)')['loader']
>
