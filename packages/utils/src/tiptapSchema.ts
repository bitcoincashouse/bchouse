import { z } from 'zod'
import { trimStartAndEnd } from './trimStartAndEnd'

const mentionSchemaAttrs = z
  .object({
    id: z.string(),
    label: z.string(),
  })
  .strict()

const mentionSchemaMark = z
  .object({
    type: z.enum(['bold', 'italic']),
  })
  .strict()

const hashtagSchemaAttrs = z
  .object({
    id: z.null(),
    label: z.string(),
  })
  .strict()

const hashtagSchemaMark = z.object({
  type: z.enum(['bold', 'italic']),
})

const hardBreakSchema = z.object({
  type: z.literal('hardBreak'),
})

const textSchemaMark = z
  .object({
    type: z.enum(['bold', 'italic']),
  })
  .strict()
  .or(
    z
      .object({
        type: z.literal('link'),
        attrs: z.object({
          href: z.string().url(),
        }),
      })
      .strip()
  )

const mediaSchemaAttrs = z
  .object({
    id: z.string(),
    alt: z
      .string()
      .optional()
      .nullable()
      .transform((val) => (!val ? undefined : val)),

    title: z
      .string()
      .optional()
      .nullable()
      .transform((val) => (!val ? undefined : val)),
  })
  .strict()

export const mentionSchema = z
  .object({
    type: z.literal('mention'),
    attrs: mentionSchemaAttrs,
    marks: z.array(mentionSchemaMark).optional(),
  })
  .strict()

export const hashtagSchema = z
  .object({
    type: z.literal('hashtag'),
    attrs: hashtagSchemaAttrs,
    marks: z.array(hashtagSchemaMark).optional(),
  })
  .strict()

export const textSchema = z
  .object({
    type: z.literal('text'),
    text: z.string(),
    marks: z.array(textSchemaMark).optional(),
  })
  .strict()

export const paragraphContentSchema = z
  .array(textSchema.or(hashtagSchema).or(mentionSchema).or(hardBreakSchema))
  .transform((val) => {
    //Remove empty text nodes
    return trimStartAndEnd(
      val || [],
      (node) => node.type !== 'text' || node.text.trim().length > 0
    )
  })

export const paragraphSchema = z
  .object({
    type: z.literal('paragraph'),
    content: paragraphContentSchema,
  })
  .strict()

export const mediaSchema = z
  .object({
    type: z.literal('media'),
    attrs: mediaSchemaAttrs,
  })
  .strict()

export const docSchema = z
  .object({
    type: z.literal('doc'),
    content: z.array(paragraphSchema.or(mediaSchema)),
  })
  .strict()

export namespace TipTapSchema {
  export type Text = z.infer<typeof textSchema>
  export type Mention = z.infer<typeof mentionSchema>
  export type Hashtag = z.infer<typeof hashtagSchema>
  export type Paragraph = z.infer<typeof paragraphSchema>
  export type Media = z.infer<typeof mediaSchema>
  export type Doc = {
    type: 'doc'
    content: (Paragraph | Media)[]
  }
}
