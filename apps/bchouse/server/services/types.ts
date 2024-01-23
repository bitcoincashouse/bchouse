import { Network } from '../db/types'
import { Doc } from '../utils/tiptapSchema'

export type PostCardModel = {
  id: string
  key: string
  type: string
  isBlocked?: boolean
  isMuted?: boolean
  repostedById?: string
  repostedBy?: string
  wasReposted: boolean
  wasLiked: boolean
  wasTipped: boolean
  deleted: boolean
  campaignId?: string | null
  parentPost?: {
    id: string
    publishedById: string
    handle: string
    name: string
  } | null
  person: {
    name: string
    href: string
    handle: string
    bchAddress?: string | null
    network?: Network | null
  }
  replyCount: number
  repostCount: number
  quoteCount: number
  likeCount: number
  tipAmount: number
  publishedById: string
  viewCount: number
  avatarUrl: string | undefined
  content: Doc
  date: string
  isThread: boolean
  mediaUrls: {
    url: string
    height: number
    width: number
  }[]
  embed?: string | undefined | null
  monetization?:
    | {
        network: Network
        campaignId: string
        amount: number
        address: string
        raised: number
        expiresAt: number
        fulfilledAt?: number
        contributionCount: number
        title: string
        donationAddress: string
        version: number
      }
    | undefined
}
