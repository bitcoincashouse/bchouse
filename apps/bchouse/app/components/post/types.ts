import { SerializeFrom } from '@remix-run/node'
import type { PostCardModel as PostModel } from '~/server/services/types'
import { Network } from '~/utils/bchUtils'

export type Post = PostCardModel
export type PostCardModel = SerializeFrom<PostModel>
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
