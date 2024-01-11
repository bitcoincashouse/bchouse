import { Doc, Hashtag, Media, Mention, Text } from '../utils/tiptapSchema'

import { TipEvent, inngest } from '@bchouse/inngest'
import { z } from 'zod'
import { logger } from '~/utils/logger'
import { prettyPrintSats } from '~/utils/prettyPrintSats'
import { InternalServerError } from '../../app/utils/withErrorHandler'
import { db } from '../db'
import { Network } from '../db/types'
import postRepo from '../repositories/posts'
import { getCampaignDonorPosts } from '../repositories/posts/getCampaignDonorPosts'
import { KyselyPostDbModel } from '../repositories/posts/types'
import * as tipRepository from '../repositories/tip'
import { valiateUser } from '../repositories/user/getUserExists'
import { getUserIsAdmin } from '../repositories/user/getUserIsAdmin'
import { SATS_PER_BCH, detectAddressNetwork } from '../utils/bchUtils'
import HttpStatus from '../utils/http-status'
import moment from '../utils/moment'
import { paygateInvoiceReq } from '../utils/paygateInvoiceReq'
import { serializeCursor } from '../utils/serializeCursor'
import { CampaignService } from './campaign'
import { setMediaPublic, validateImageUploadRequest } from './images'
import { RedisService } from './redis'
import { SearchService } from './search'
import { PostCardModel } from './types'

type SubscriptionCallback = (event: 'success' | 'error') => void

export class PostService {
  constructor(
    private readonly redisService: RedisService,
    private readonly searchService: SearchService,
    private readonly campaignService: CampaignService
  ) {}

  readonly subscriptions = new Map<string, SubscriptionCallback>()

  subscribe(requestId: string, callback: SubscriptionCallback) {
    this.subscriptions.set(requestId, callback)
    return requestId
  }

  unsubscribe(requestId: string) {
    this.subscriptions.delete(requestId)
  }

  async publishSuccessfulTip(event: TipEvent['data']) {
    //Publish to subscribers (SSE)
    Promise.resolve().then(() => {
      try {
        this.subscriptions.get(event.tipRequestId)?.('success')
      } catch (err) {
        logger.error('Failed to publish tip event', err)
      }
    })

    await inngest.send({
      name: 'tip/success',
      data: event,
    })
  }

  async createTipInvoice({
    postId,
    userId,
    paygateUrl,
    amount,
  }: {
    amount: bigint
    postId: string
    userId: string | null
    paygateUrl: string
  }) {
    const post = await postRepo.getPostById({
      currentUserId: userId,
      id: postId,
    })

    if (!post) {
      throw new Error('Post not found')
    }

    if (!post.publishedBy.bchAddress) {
      throw new Error('User does not have a bitcoin cash address set')
    }

    const network = detectAddressNetwork(post.publishedBy.bchAddress)

    if (!network) {
      throw new Error("Could not detect user's network")
    }

    const [tipAmountStr, tipAmountDenomination] = prettyPrintSats(
      Number(amount)
    )

    const { invoiceId, paymentUrl } = await paygateInvoiceReq(paygateUrl, {
      network,
      address: post.publishedBy.bchAddress,
      amount: Number(amount),
      memo: `Tip ${tipAmountStr}${tipAmountDenomination} to ${
        post.publishedBy.fullName || post.publishedBy.username
      }`,
      event: {
        name: 'tip/deposit',
        data: {
          postId,
          userId,
        },
      },
    })

    await tipRepository.createTipRequest({
      invoiceId,
      network,
      postId,
      userId,
    })

    return {
      invoiceId,
      paymentUrl: `${paymentUrl}/${amount.toString()}`,
      network,
    }
  }

  async removePost(userId: string, postId: string) {
    const result = await db
      .updateTable('Post as p')
      .where((eb) =>
        eb('p.publishedById', '=', userId).and('p.id', '=', postId)
      )
      .set({
        deleted: 1,
      })
      .executeTakeFirst()

    if (
      (result.numChangedRows && result.numChangedRows > 0n) ||
      result.numUpdatedRows > 0n
    ) {
      //TODO: get all likes and retweets of this post and delete from redis
      await Promise.all([
        this.redisService.removeFromTimeline(postId, userId),
        this.searchService.removePost(postId),
      ])
    }
  }

  async findEmbed(urls: string[]) {
    const KEY = '8fb648a43d7cabada3cae0e30ac0322b'
    for (let i = 0; i < urls.length; i++) {
      const url = urls[i] as string

      const result = await fetch(
        `https://cdn.iframe.ly/api/iframely?url=${encodeURIComponent(
          url
        )}&key=${KEY}`
      )
        .then((res) => res.json())
        .then((res) => {
          const result = z
            .object({
              html: z.string(),
            })
            .or(
              z.object({
                error: z.number(),
                message: z.string(),
              })
            )
            .safeParse(res)

          if (!result.success) {
            throw {
              code: 500,
              message: 'Failed to parse error',
            }
          } else if ('error' in result.data) {
            throw {
              code: result.data.error,
              message: result.data.message,
            }
          } else {
            return { __html: result.data.html }
          }
        })
        .catch(() => undefined)

      if (result) {
        return url
      }
    }

    return undefined
  }

  async addPost(
    currentUserId: string,
    post: {
      content: Doc
      audienceType: 'PUBLIC' | 'CIRCLE' | 'CHILD'
      mediaIds: string[]
      //TODO: check access
      parentPost?: {
        id: string
        publishedById: string
      }
      monetization?: {
        amount: bigint
        expires: Date
        payoutAddress: string
        title: string
        network: Network
      } | null
    }
  ) {
    if (post.mediaIds && post.mediaIds.some((m) => !m)) {
      throw new Error('Invalid args: mediaIds cannot be empty')
    }

    const {
      media: inlineMedia,
      hashtags,
      mentions,
      links,
    } = parseContent(post.content)

    await Promise.all([
      validateMedia(inlineMedia, post.mediaIds),
      validateMentions(mentions),
    ])

    if (post.monetization) {
      const isAdmin = await getUserIsAdmin({ userId: currentUserId })
      if (!isAdmin && post.monetization.amount > 0.1 * SATS_PER_BCH) {
        throw new Error('Invalid amount')
      }
    }

    let embed = await this.findEmbed(links)
    const uniqueMentions = [
      ...new Set(
        mentions.map((m) => ({
          userId: m.attrs.id,
        }))
      ),
    ]

    const { postId, campaignId } = await postRepo.createPost({
      userId: currentUserId,
      post: {
        ...post,
        monetization: post.monetization
          ? {
              ...post.monetization,
              version: 2,
              //TODO: Get address in repo so same version
              donationAddress: this.campaignService.getDonationAddress({
                version: 2,
                network: post.monetization.network,
                payoutAddress: post.monetization.payoutAddress,
                amount: BigInt(post.monetization.amount),
                expires: moment(post.monetization.expires).unix(),
              }),
            }
          : undefined,
      },
      mentions: uniqueMentions,
      hashtags: hashtags.map((h) => ({
        tag: h.attrs.label,
      })),
      inlineMedia: inlineMedia.map((m) => ({
        key: m.attrs.id,
      })),
      embed,
    })

    const postModel = {
      ...post,
      id: postId,
      publishedById: currentUserId,
      createdAt: new Date(),
      monetization:
        campaignId && post.monetization
          ? {
              id: campaignId,
              amount: Number(post.monetization.amount),
              expiresAt: moment(post.monetization.expires).unix(),
              address: post.monetization.payoutAddress,
              title: post.monetization.title,
              network: post.monetization.network,
              //TODO: Get address in repo so same version
              version: 2,
            }
          : undefined,
      mentions: uniqueMentions,
      hashtags: hashtags.map((h) => ({
        tag: h.attrs.label,
      })),
      inlineMedia: inlineMedia.map((m) => ({
        key: m.attrs.id,
      })),
      embed,
    }

    await Promise.all([
      this.searchService.addPost(postModel),
      this.redisService.addPost(postModel),
      this.redisService.postToTimeline(postId, currentUserId),
    ])

    return postId
  }

  async removeReply() {}

  async addPostLike(userId: string, postId: string, publishedById: string) {
    if (await postRepo.likePost({ userId: userId, postId })) {
      await this.redisService.addLike(userId, postId, publishedById)
    }
  }

  async removePostLike(userId: string, postId: string, publishedById: string) {
    if (await postRepo.unlikePost({ userId: userId, postId })) {
      await this.redisService.removeLike(userId, postId, publishedById)
    }
  }

  async addRepost(userId: string, postId: string, publishedById: string) {
    if (await postRepo.repost({ userId: userId, postId })) {
      await Promise.all([
        this.redisService.addRepost(postId, publishedById, userId),
        this.redisService.postToTimeline(postId, publishedById, userId),
      ])
    }
  }

  async removeRepost(userId: string, postId: string, publishedById: string) {
    if (await postRepo.unrepostPost({ userId: userId, postId })) {
      await Promise.all([
        this.redisService.removeRepost(postId, publishedById, userId),
        this.redisService.removeFromTimeline(postId, publishedById, userId),
      ])
    }
  }

  async getPostWithChildren(currentUserId: string | null, postId: string) {
    const [parentPosts, postModel, childPosts] = await Promise.all([
      postRepo.getPostParents({ id: postId, currentUserId }),
      postRepo.getPostById({ id: postId, currentUserId }),
      postRepo.getPostChildren({ id: postId, currentUserId }),
    ])

    if (!postModel) {
      throw new InternalServerError({
        code: HttpStatus.NOT_FOUND,
        message: 'Post not found',
      })
    }

    return {
      nextCursor: serializeCursor(childPosts.nextCursor),
      previousCursor: serializeCursor(parentPosts.previousCursor),
      ancestors: parentPosts.results.map((p) => postToViewModel(p)),
      children: childPosts.results.map((p) => postToViewModel(p)),
      mainPost: postToViewModel(postModel),
    }
  }

  async getCampaignPostWithChildren(
    currentUserId: string | null,
    postId: string
  ) {
    const [parentPosts, postModel, childPosts, donorPosts] = await Promise.all([
      postRepo.getPostParents({ id: postId, currentUserId }),
      postRepo.getPostById({ id: postId, currentUserId }),
      postRepo.getPostChildren({ id: postId, currentUserId }),
      getCampaignDonorPosts({ postId, currentUserId }),
    ])

    if (!postModel) {
      throw new InternalServerError({
        code: HttpStatus.NOT_FOUND,
        message: 'Post not found',
      })
    }

    return {
      ancestors: parentPosts.results.map((p) => postToViewModel(p)),
      previousCursor: serializeCursor(parentPosts.previousCursor),

      children: childPosts.results.map((p) => postToViewModel(p)),
      nextCursor: serializeCursor(childPosts.nextCursor),

      mainPost: postToViewModel(postModel),
      donorPosts: donorPosts,
    }
  }
}

async function validateMentions(mentions: Mention[]) {
  await Promise.all(
    mentions.map(async (mention) => {
      const exists = await valiateUser({
        userId: mention.attrs.id,
        username: mention.attrs.label,
      })
      if (!exists) {
        throw new Error('Mentioned user does not exist')
      }
    })
  )
}

async function validateMedia(media: Media[], postMediaIds: string[]) {
  const embeddedMediaIds = media.map((media) => media.attrs.id)
  const allMediaIds = [...postMediaIds, ...embeddedMediaIds]

  if (allMediaIds.length) {
    await Promise.all(
      allMediaIds.map(async (key) => {
        await Promise.resolve()
        return await validateImageUploadRequest(key)
      })
    ).then(() =>
      Promise.all(
        allMediaIds.map(async (key) => {
          return await setMediaPublic(key)
        })
      )
    )
  }
}

function parseContent(doc: Doc) {
  const media = [] as Media[]
  const mentions = [] as Mention[]
  const hashtags = [] as Hashtag[]
  const links = [] as string[]
  const text = [] as Text[]

  const content = doc.content
  for (let i = 0; i < content.length; i++) {
    const docItem = content[i] as NonNullable<(typeof content)[number]>

    if (docItem.type === 'paragraph') {
      const paragraph = docItem

      for (let j = 0; j < paragraph.content.length; j++) {
        const paragraphItem = paragraph.content[j] as NonNullable<
          (typeof paragraph.content)[number]
        >

        if (paragraphItem.type === 'hashtag') {
          hashtags.push(paragraphItem)
        } else if (paragraphItem.type === 'mention') {
          mentions.push(paragraphItem)
        } else if (paragraphItem.type === 'text') {
          paragraphItem.marks?.forEach((mark) => {
            if (mark.type === 'link') {
              links.push(mark.attrs.href)
            }
          })

          text.push(paragraphItem)
        }
      }
    } else if (docItem.type === 'media') {
      media.push(docItem)
    }
  }

  return {
    mentions,
    hashtags,
    media,
    links,
    text,
  }
}

function postToViewModel(
  post: KyselyPostDbModel & {
    monetization?:
      | {
          campaignId: string
          address: string
          amount: number
          expires: number
          raised: number
          contributionCount: number
          fulfillmentTimestamp?: number
          fulfillmentTxId?: string
          title: string
          network: Network
          donationAddress: string
          version: number
        }
      | undefined
  }
): PostCardModel {
  const postVm: PostCardModel = post.deleted
    ? {
        deleted: true,
        id: post.id,
        type: 'comment',
        key: post.key,
        wasTipped: false,
        tipAmount: 0,
        mediaUrls: [],
        repostedBy: undefined,
        repostedById: undefined,
        wasReposted: false,
        wasLiked: false,
        campaignId: post.campaignId,
        person: {
          name: '',
          href: '#',
          handle: '',
          bchAddress: null,
        },
        publishedById: '',
        replyCount: 0,
        viewCount: 0,
        likeCount: 0,
        repostCount: 0,
        quoteCount: 0,
        avatarUrl: '',
        embed: null,
        content: {
          content: [
            {
              type: 'paragraph',
              content: [
                {
                  type: 'text',
                  text: 'This post was deleted',
                },
              ],
            },
          ],
        } as Doc,
        date: moment(post.createdAt).fromNow(),
        isThread: false,
        monetization: post.monetization
          ? {
              ...post.monetization,
              expiresAt: post.monetization.expires,
              fulfilledAt: post.monetization.fulfillmentTimestamp,
            }
          : undefined,
      }
    : {
        deleted: false,
        id: post.id,
        type: 'comment',
        key: post.key,
        wasTipped: post._computed.wasTipped,
        tipAmount: post._count.tipAmount,
        campaignId: post.campaignId,
        mediaUrls: post.mediaUrls?.filter(Boolean) || [],
        repostedBy: post._computed.repostedBy,
        repostedById: post._computed.repostedById,
        wasReposted: post._computed.wasReposted,
        wasLiked: post._computed.wasLiked,
        embed: post.embed,
        person: {
          name: post.publishedBy.fullName || post.publishedBy.username,
          href: '#',
          handle: post.publishedBy.username,
          bchAddress: post.publishedBy.bchAddress,
          network: post.publishedBy.bchAddress
            ? detectAddressNetwork(post.publishedBy.bchAddress)
            : null,
        },
        publishedById: post.publishedById,
        replyCount: post._count.replies,
        viewCount: 1,
        likeCount: post._count.likes,
        repostCount: post._count.reposts,
        quoteCount: post._count.quotePosts,
        avatarUrl: post.publishedBy.avatarUrl,
        content: post.content as Doc,
        date: moment(post.createdAt).fromNow(),
        isThread: post._computed.isThread,
        monetization: post.monetization
          ? {
              ...post.monetization,
              expiresAt: post.monetization.expires,
              fulfilledAt: post.monetization.fulfillmentTimestamp,
            }
          : undefined,
      }

  return postVm
}
