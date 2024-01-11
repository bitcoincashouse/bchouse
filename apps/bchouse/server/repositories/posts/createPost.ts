import { sql } from 'kysely'
import { v4 as uuid } from 'uuid'
import { Network, db } from '../../db/index'
import moment from '../../utils/moment'

export async function createPost(params: {
  userId: string
  post: {
    content: object
    parentPost?: {
      id: string
    }
    audienceType: 'PUBLIC' | 'CIRCLE' | 'CHILD'
    mediaIds?: string[]
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
      mediaIds = [],
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
      if (mediaIds.length) {
        return trx
          .insertInto('Media')
          .values(
            mediaIds.map((mediaId) => {
              return {
                postId,
                url: mediaId,
              }
            })
          )
          .execute()
      }
      return Promise.resolve()
    }

    const insertMentions = () => {
      if (mentions.length) {
        return trx
          .insertInto('Mention')
          .values(
            mentions.map((mention) => {
              return {
                mention_user_id: mention.userId,
                postId,
              }
            })
          )
          .execute()
      }

      return Promise.resolve()
    }

    const insertHashtags = () => {
      if (hashtags.length) {
        return trx
          .insertInto('Hashtag')
          .values(
            hashtags.map((hashtag) => {
              return {
                hashtag: hashtag.tag,
                postId,
              }
            })
          )
          .execute()
      }
      return Promise.resolve()
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
