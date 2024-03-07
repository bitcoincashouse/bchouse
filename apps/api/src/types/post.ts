import { docSchema, getExtensions, moment } from '@bchouse/utils'
import { JSONContent, generateText } from '@tiptap/core'
import { isValidAddress } from 'bchaddrjs'
import { z } from 'zod'

export type CreateTopLevelPostParams = z.input<typeof topLevelPost>
export type CreateChildPostParams = z.input<typeof childPost>
export type CreatePostParams = CreateTopLevelPostParams | CreateChildPostParams

const commentSchema = z
  .string()
  .transform((val) => JSON.parse(val))
  .pipe(docSchema)

const topLevelPost = z.object({
  comment: commentSchema,
  mediaIds: z
    .string()
    .optional()
    .transform((value) => value?.split(',').filter(Boolean) || []),
  audienceType: z
    .enum(['circle', 'everyone'])
    .transform((s) =>
      s === 'everyone' ? ('PUBLIC' as const) : ('CIRCLE' as const)
    ),
  monetization: z
    .object({
      payoutAddress: z.string().refine((val) => isValidAddress(val)),
      network: z.enum([
        'mainnet',
        'chipnet',
        'testnet3',
        'testnet4',
        'regtest',
      ]),
      amount: z.coerce.number().transform((val) => BigInt(val)),
      expires: z.coerce.number().transform((val) => moment.unix(val).toDate()),
      title: z.string().min(3, 'Title too short'),
    })
    .optional(),
})

const childPost = z.object({
  comment: commentSchema,
  mediaIds: z
    .string()
    .optional()
    .transform((value) => value?.split(',').filter(Boolean) || []),
  //Non-top level post
  parentPost: z.object({
    id: z.string().nonempty(),
    publishedById: z.string().nonempty(),
  }),
})

export const postSchema = topLevelPost.or(childPost).refine((post) => {
  if (post.mediaIds.length) return true

  const text = generateText(
    post.comment as JSONContent,
    //TODO: getExtensions without needing placeholder or removeFile since not necessary for generating text
    // Only really necessary for rendering in views
    getExtensions('Placeholder', () => {})
  )

  return !!text.length
}, 'Post requires body or media')
