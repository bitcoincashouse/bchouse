import { logger } from '@bchouse/utils'
import { ActionFunctionArgs } from '@remix-run/node'
import { z } from 'zod'
import { removeToken } from '~/.server/services/services/tokens/db'
import {
  initialTokenLoad,
  updateNFTTypes,
} from '~/.server/services/services/tokens/init'

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
    iconRepository: z.string().optional(),
    imageRepository: z.string().optional(),
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
      await updateNFTTypes(result.Id, result.Properties)
      await initialTokenLoad(result.Properties.categoryId)
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
