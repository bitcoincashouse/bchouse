import type { ColumnType } from 'kysely'
export type Generated<T> = T extends ColumnType<infer S, infer I, infer U>
  ? ColumnType<S, I | undefined, U>
  : ColumnType<T, T | undefined, T>
export type Timestamp = ColumnType<Date, Date | string, Date | string>

export const ManualAction = {
  ALLOW: 'ALLOW',
  REMOVE: 'REMOVE',
} as const
export type ManualAction = (typeof ManualAction)[keyof typeof ManualAction]
export const PostAudience = {
  PUBLIC: 'PUBLIC',
  CIRCLE: 'CIRCLE',
  CHILD: 'CHILD',
} as const
export type PostAudience = (typeof PostAudience)[keyof typeof PostAudience]
export const PostType = {
  COMMENT: 'COMMENT',
  POLL: 'POLL',
  EVENT: 'EVENT',
  ANNOUNCEMENT: 'ANNOUNCEMENT',
} as const
export type PostType = (typeof PostType)[keyof typeof PostType]
export const PostPublishState = {
  SAVED: 'SAVED',
  DRAFT: 'DRAFT',
  REVIEW: 'REVIEW',
  PUBLISHED: 'PUBLISHED',
} as const
export type PostPublishState =
  (typeof PostPublishState)[keyof typeof PostPublishState]
export const MediaPlacement = {
  Inline: 'Inline',
  Attached: 'Attached',
} as const
export type MediaPlacement =
  (typeof MediaPlacement)[keyof typeof MediaPlacement]
export const UploadRequestType = {
  COVER_PHOTO: 'COVER_PHOTO',
  AVATAR: 'AVATAR',
  POST: 'POST',
} as const
export type UploadRequestType =
  (typeof UploadRequestType)[keyof typeof UploadRequestType]
export const CampaignSpendType = {
  START: 'START',
  FORWARD: 'FORWARD',
  PLEDGE: 'PLEDGE',
  PAYOUT: 'PAYOUT',
  REFUND: 'REFUND',
} as const
export type CampaignSpendType =
  (typeof CampaignSpendType)[keyof typeof CampaignSpendType]
export const PledgeType = {
  STARTED: 'STARTED',
  STARTING: 'STARTING',
  DONATION: 'DONATION',
} as const
export type PledgeType = (typeof PledgeType)[keyof typeof PledgeType]
export const Network = {
  mainnet: 'mainnet',
  testnet3: 'testnet3',
  testnet4: 'testnet4',
  chipnet: 'chipnet',
  regtest: 'regtest',
} as const
export type Network = (typeof Network)[keyof typeof Network]
export type AnyonecanpayPledge = {
  pledgeId: string
  campaignId: string
  userId: string | null
  txid: string
  vout: number
  satoshis: bigint
  lockingScript: string
  unlockingScript: string
  seqNum: bigint
  createdAt: Generated<Timestamp>
  address: string
  name: string | null
  comment: string | null
  spentAt: Timestamp | null
}
export type Block = {
  id: Generated<string>
  userId: string
  blockedUserId: string
  createdAt: Generated<Timestamp>
}
export type Campaign = {
  id: Generated<string>
  satoshis: bigint
  expires: number
  address: string
  title: Generated<string>
  campaignerId: string
  donationAddress: string
  version: number
  createdAt: Generated<Timestamp>
  network: Generated<Network>
  refunded: Generated<number>
  pledgedAmount: bigint | null
  payoutTxId: string | null
  payoutTxTimestamp: Timestamp | null
}
export type CampaignContractSpendTransaction = {
  txid: string
  campaignId: string
  parentTxId: string | null
  categoryId: string
  satoshis: bigint
  type: CampaignSpendType
  timestamp: Generated<Timestamp>
  pledgePaymentId: string | null
  pledgeRefundId: string | null
}
export type CampaignNFT = {
  txid: string
  satoshis: bigint
}
export type CircleMembership = {
  id: Generated<string>
  ownerId: string
  memberId: string
  createdAt: Generated<Timestamp>
}
export type Follows = {
  id: Generated<string>
  followerId: string
  followedId: string
  createdAt: Generated<Timestamp>
}
export type Hashtag = {
  id: Generated<string>
  hashtag: string
  postId: string
}
export type Invite = {
  id: string
  userId: string
  emailAddress: string
}
export type InviteCode = {
  id: string
  code: string
  userId: string
  claimedEmailAddress: string | null
  createdAt: Generated<Timestamp>
}
export type Likes = {
  id: Generated<string>
  userId: string
  postId: string
  createdAt: Generated<Timestamp>
}
export type ManualReportAction = {
  id: Generated<string>
  action: ManualAction
  postId: string
  createdAt: Generated<Timestamp>
}
export type Media = {
  id: Generated<string>
  url: string
  postId: string
  idx: number
  placement: Generated<MediaPlacement>
  createdAt: Generated<Timestamp>
  width: number | null
  height: number | null
}
export type Mention = {
  id: Generated<string>
  mention_user_id: string
  postId: string
}
export type Mute = {
  id: Generated<string>
  userId: string
  mutedUserId: string
  createdAt: Generated<Timestamp>
}
export type PledgePayment = {
  pledgeId: string
  txid: string
  vout: number
  createdAt: Generated<Timestamp>
  satoshis: bigint
  address: string
  returnAddress: string
  type: PledgeType
  cancelTxId: string | null
  name: string | null
  comment: string | null
}
export type PledgeRequest = {
  id: Generated<string>
  campaignId: string
  userId: string | null
  network: Network
  createdAt: Generated<Timestamp>
  secret: Generated<string>
}
export type Post = {
  id: Generated<string>
  type: PostType
  publishedById: string
  content: unknown
  status: PostPublishState
  audience: Generated<PostAudience>
  deleted: Generated<number>
  embed: string | null
  createdAt: Generated<Timestamp>
  updatedAt: Timestamp
  viewCount: Generated<number>
  hasMediaContent: Generated<number>
  campaignId: string | null
  parentPostId: string | null
  quotePostId: string | null
}
export type PostPaths = {
  ancestorId: string
  descendantId: string
  depth: number
}
export type ReportedPosts = {
  id: Generated<string>
  postId: string
  reporterId: string
  createdAt: Generated<Timestamp>
  updatedAt: Timestamp
}
export type Reposts = {
  id: Generated<string>
  userId: string
  postId: string
  createdAt: Generated<Timestamp>
}
export type TipPayment = {
  tipId: string
  txid: string
  vout: number
  createdAt: Generated<Timestamp>
  satoshis: bigint | null
  address: string
  name: string | null
  comment: string | null
}
export type TipRequest = {
  id: Generated<string>
  postId: string
  userId: string | null
  network: Network
  createdAt: Generated<Timestamp>
}
export type TokenCategory = {
  id: string
  categoryId: string
  lastHash: string
  deleted: Generated<number>
}
export type TokenTypes = {
  commitment: string
  categoryId: string
  description: string | null
  attributes: unknown | null
  image: string | null
  name: string
  currentOwnerAddress: string | null
}
export type UploadRequest = {
  id: Generated<string>
  type: UploadRequestType
  userId: string
  createdAt: Generated<Timestamp>
  updatedAt: Timestamp
}
export type User = {
  id: string
  username: string
  __isAdmin: Generated<number | null>
  fullName: string | null
  firstName: string | null
  lastName: string | null
  avatarUrl: string | null
  coverPhotoUrl: string | null
  email: string | null
  about: string | null
  website: string | null
  company: string | null
  title: string | null
  location: string | null
  bchAddress: string | null
  lastViewedNotifications: Timestamp | null
  createdAt: Generated<Timestamp>
  updatedAt: Timestamp
  lastActiveAt: Timestamp | null
}
export type DB = {
  AnyonecanpayPledge: AnyonecanpayPledge
  Block: Block
  Campaign: Campaign
  CampaignContractSpendTransaction: CampaignContractSpendTransaction
  CampaignNFT: CampaignNFT
  CircleMembership: CircleMembership
  Follows: Follows
  Hashtag: Hashtag
  Invite: Invite
  InviteCode: InviteCode
  Likes: Likes
  ManualReportAction: ManualReportAction
  Media: Media
  Mention: Mention
  Mute: Mute
  PledgePayment: PledgePayment
  PledgeRequest: PledgeRequest
  Post: Post
  PostPaths: PostPaths
  ReportedPosts: ReportedPosts
  Reposts: Reposts
  TipPayment: TipPayment
  TipRequest: TipRequest
  TokenCategory: TokenCategory
  TokenTypes: TokenTypes
  UploadRequest: UploadRequest
  User: User
}
