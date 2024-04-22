import { logger } from '@bchouse/utils'
import { ActionFunctionArgs } from '@remix-run/node'
import { QueryClient } from '@tanstack/react-query'
import { z } from 'zod'
import { db } from '~/.server/services/db'
import { importTokenRegistryMetadata } from '~/components/utils/nfts'

const linkSchema = z.array(
  z.object({
    Url: z.string().url().optional(),
    Title: z.string().optional(),
    Target: z.enum(['_blank']).optional(),
    LinkType: z.enum(['External']).optional(),
  })
)

const publishTokenSchema = z.object({
  Name: z.string(),
  CreateDate: z.coerce.date(),
  UpdateDate: z.coerce.date(),
  Route: z.object({
    Path: z.string(),
    StartItem: z.object({
      Id: z.string().uuid(),
      Path: z.string(),
    }),
  }),
  Id: z.string().uuid(),
  ContentType: z.literal('token'),
  Properties: z.object({
    categoryId: z.string(),
    registry: linkSchema,
    link: linkSchema,
  }),
})

const deleteOrUnpublishTokenSchema = z.object({
  Id: z.string().uuid(),
})

export async function action(_: ActionFunctionArgs) {
  try {
    const event = z
      .enum([
        'Umbraco.ContentPublish',
        'Umbraco.ContentUnpublish',
        'Umbraco.ContentDelete',
      ])
      .parse(_.request.headers.get('umb-webhook-event'))

    const retryCount = z.coerce
      .number()
      .parse(_.request.headers.get('umb-webhook-retrycount'))

    const body = await _.request.json()

    console.log(body, event)

    if (event === 'Umbraco.ContentPublish') {
      //Fetch the token registry, hash the results and if no change, can return early.
      const result = publishTokenSchema.parse(body)
      await addToken(result.Id, result.Properties.categoryId)
    } else if (
      event === 'Umbraco.ContentUnpublish' ||
      event === 'Umbraco.ContentDelete'
    ) {
      //Mark token as removed.
      const result = deleteOrUnpublishTokenSchema.parse(body)
      await removeToken(result.Id)
    }
  } catch (err) {
    logger.error('Failed to parse webhook body', err)
  }

  return null
}

const queryClient = new QueryClient()

async function addToken(id: string, categoryId: string) {
  const { registry, hash } = await queryClient.fetchQuery({
    queryKey: ['registryFetch', categoryId],
    queryFn: () => importTokenRegistryMetadata(categoryId),
    gcTime: 1000 * 60 * 60,
  })

  const { lastHash } = (await db
    .selectFrom('TokenCategory')
    .select('lastHash')
    .where('categoryId', '=', categoryId)
    .executeTakeFirst()) ?? { lastHash: undefined }

  //If never fetched or updated, update storage to include the new/updated information.
  if (!lastHash || lastHash !== hash) {
    try {
      const token = {
        id,
        categoryId: categoryId,
        lastHash: hash,
      }

      await db
        .insertInto('TokenCategory')
        .values(token)
        .onDuplicateKeyUpdate(token)
        .execute()

      const identity = registry.identities[categoryId]
      if (identity) {
        const latestKey = Object.keys(identity)[0] || ''
        const latestIdentity = identity[latestKey]
        if (latestIdentity) {
          const types = Object.keys(
            latestIdentity.token?.nfts?.parse?.types || {}
          )
          let batchSize = 20
          for (let i = 0; i < types.length; i += batchSize) {
            await db.transaction().execute(async (trx) => {
              await Promise.all(
                types.slice(i, i + batchSize).map(async (commitment) => {
                  const tokenInfo =
                    latestIdentity.token?.nfts?.parse?.types?.[commitment]
                  const tokenImage =
                    tokenInfo?.uris?.icon || tokenInfo?.uris?.image
                  const tokenName = tokenInfo?.name

                  if (tokenInfo && tokenName && tokenImage) {
                    //TODO: Save image to S3.
                    //TODO: Save token information in batches for speed
                    const token = {
                      commitment,
                      name: tokenName,
                      categoryId,
                      image: tokenImage,
                      description: tokenInfo.description,
                      attributes:
                        JSON.stringify(tokenInfo.extensions?.attributes) ||
                        null,
                    }

                    await trx
                      .insertInto('TokenTypes')
                      .values(token)
                      .onDuplicateKeyUpdate(token)
                      .execute()
                  }
                })
              )
            })
          }
        }
      }
    } catch (err) {
      console.log(err)

      await db.transaction().execute(async (trx) => {
        await trx.deleteFrom('TokenCategory').where('id', '=', id).execute()
        await trx
          .deleteFrom('TokenTypes')
          .where('categoryId', '=', categoryId)
          .execute()
      })
    }
  }
}

async function removeToken(id: string) {
  await db
    .updateTable('TokenCategory')
    .set({
      deleted: 1,
    })
    .where('id', '=', id)
    .execute()
}
