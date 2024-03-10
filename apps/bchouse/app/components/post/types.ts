import type { PostCardModel as PostModel } from '@bchouse/api/src/services/services/types'
import { Network } from '@bchouse/utils'

export type Post = PostCardModel
export type PostCardModel = PostModel
export type { PostModel }
export type FeedOwner = {
  type?: 'user'
  isCurrentUser: boolean
  fullName?: string
  username: string
}

export type Monetization = {
  payoutAddress: string
  amount: number
  expires: number
  title: string
  network: Network
}

export type SetMonetizationCallback = (monetization: {
  payoutAddress: string
  amount: number
  network: Network
  expires: number
}) => void
