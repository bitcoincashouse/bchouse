export type KyselyPostDbModel = {
  key: string
  id: string
  mediaUrls: {
    url: string
    height: number
    width: number
  }[]
  embed: string | null
  publishedById: string
  parentPostId?: string | null
  parentPostPublishedById?: string | null
  publishedBy: {
    fullName: string
    username: string
    avatarUrl: string
    bchAddress?: string | null
  }
  content: unknown
  createdAt: Date
  replies: never[]
  campaignId?: string | null
  _count: {
    replies: number
    reposts: number
    quotePosts: number
    likes: number
    tipAmount: number
  }
  _computed: {
    wasLiked: boolean
    repostedBy?: string | undefined
    repostedById?: string | undefined
    wasReposted: boolean
    isThread: boolean
    wasTipped: boolean
  }
  deleted?: boolean
}
