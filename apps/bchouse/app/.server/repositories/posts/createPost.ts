import { moment } from '@bchouse/utils'
import { sql } from 'kysely'
import { v4 as uuid } from 'uuid'
import { Network, db } from '../../db/index'

export async function createPost(params: {
  userId: string
  post: {
    content: object
    parentPost?: {
      id: string
    }
    audienceType: 'PUBLIC' | 'CIRCLE' | 'CHILD'
    mediaUrls?: {
      url: string
      height: number
      width: number
    }[]
    monetization?: {
      amount: bigint
      payoutAddress: string
      expires: Date
      title: string
      network: Network
      donationAddress: string
      version: number
    } | null
  }
  mentions: { userId: string }[]
  hashtags: { tag: string }[]
  inlineMedia: {}[]
  embed: string | undefined
}): Promise<{ postId: string; campaignId?: string }> {
  const {
    userId,
    post: {
      content,
      parentPost: { id: parentPostId } = { id: undefined },
      audienceType = 'PUBLIC',
      mediaUrls = [],
      monetization,
    },
    hashtags,
    mentions,
    inlineMedia,
    embed,
  } = params

  const postId = uuid()
  let campaignId = uuid()

  await db.transaction().execute(async (trx) => {
    if (monetization) {
      await trx
        .insertInto('Campaign')
        .values({
          id: campaignId,
          expires: moment(monetization.expires).unix(),
          satoshis: monetization.amount,
          address: monetization.payoutAddress,
          campaignerId: userId,
          title: monetization.title,
          network: monetization.network,
          donationAddress: monetization.donationAddress,
          version: monetization.version,
        })
        .execute()
    }

    await trx
      .insertInto('Post')
      .values({
        id: postId,
        content: JSON.stringify(content),
        publishedById: userId,
        status: 'PUBLISHED',
        type: 'COMMENT',
        audience: audienceType,
        updatedAt: new Date(),
        parentPostId,
        campaignId: monetization ? campaignId : null,
        embed,
      })
      .executeTakeFirstOrThrow()

    //Insert inline media as well
    const insertMedia = () => {
      return Promise.all(
        mediaUrls.map(({ url, height, width }, index) => {
          return trx
            .insertInto('Media')
            .values({
              postId,
              url,
              height,
              width,
              idx: index + 1,
            })
            .execute()
        })
      )
    }

    const insertMentions = () => {
      return Promise.all(
        mentions.map((mention) => {
          return trx
            .insertInto('Mention')
            .values({
              mention_user_id: mention.userId,
              postId,
            })
            .execute()
        })
      )
    }

    const insertHashtags = () => {
      return Promise.all(
        hashtags.map((hashtag) => {
          return trx
            .insertInto('Hashtag')
            .values({
              hashtag: hashtag.tag,
              postId,
            })
            .execute()
        })
      )
    }

    const insertPostPaths = () => {
      return trx
        .insertInto('PostPaths')
        .columns(['ancestorId', 'descendantId', 'depth'])
        .expression((eb) => {
          return parentPostId
            ? eb
                .selectFrom('PostPaths as path')
                .where('path.descendantId', '=', parentPostId)
                .select([
                  'path.ancestorId',
                  eb.val(postId).as('descendantId'),
                  sql`path.depth+1`.as('depth'),
                ])
                .unionAll(
                  eb.selectNoFrom([
                    eb.val(postId).as('ancestorId'),
                    eb.val(postId).as('descendantId'),
                    eb.val(0).as('depth'),
                  ])
                )
            : eb.selectNoFrom([
                eb.val(postId).as('ancestorId'),
                eb.val(postId).as('descendantId'),
                eb.val(0).as('depth'),
              ])
        })
        .execute()
    }

    await Promise.all([
      insertMedia(),
      insertMentions(),
      insertHashtags(),
      insertPostPaths(),
    ])
  })

  return { postId, campaignId }
}
