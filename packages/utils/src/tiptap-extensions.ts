import { JSONContent, Node } from '@tiptap/core'
import Bold from '@tiptap/extension-bold'
import Document from '@tiptap/extension-document'
import Dropcursor from '@tiptap/extension-dropcursor'
import Gapcursor from '@tiptap/extension-gapcursor'
import { HardBreak } from '@tiptap/extension-hard-break'
import { History } from '@tiptap/extension-history'
import Italic from '@tiptap/extension-italic'
import { Link } from '@tiptap/extension-link'
import { Mention } from '@tiptap/extension-mention'
import Paragraph from '@tiptap/extension-paragraph'
import { Placeholder } from '@tiptap/extension-placeholder'
import Text from '@tiptap/extension-text'
import { PluginKey } from '@tiptap/pm/state'
import { mergeAttributes } from '@tiptap/react'
import { z } from 'zod'
import {
  TipTapSchema,
  docSchema,
  mediaSchema,
  paragraphContentSchema,
  paragraphSchema,
} from './tiptapSchema'

export const Media = Node.create({
  name: 'media',
  atom: true,
  group: 'block',
  draggable: true,
  defining: true,
  parseHTML() {
    return [
      {
        tag: `div[class*="${this.name}"]`,
      },
    ]
  },
  addAttributes() {
    return {
      src: {
        isRequired: true,
      },
      alt: {
        isRequired: false,
      },
      title: {
        isRequired: false,
      },
    }
  },
  renderHTML({ HTMLAttributes, node }) {
    return ['media', mergeAttributes(HTMLAttributes)]
  },
})

export const getExtensions = (
  placeholder: string,
  removeFile: (file: string) => void
) => [
  Document,
  Paragraph,
  HardBreak,
  Text,
  Gapcursor,
  Dropcursor,
  Bold,
  Italic,
  History,
  Link.configure({
    autolink: true,
    openOnClick: false,
    HTMLAttributes: {
      class: 'link',
    },
  }),
  Media.extend({
    name: 'media',
    addOptions() {
      return {
        removeFile,
      }
    },
  }),
  Mention.extend({
    name: 'mention',
  }).configure({
    suggestion: {
      pluginKey: new PluginKey('mention'),
      char: '@',
    },
    HTMLAttributes: {
      class: 'mention',
    },
  }),
  Mention.extend({
    name: 'hashtag',
  }).configure({
    suggestion: {
      pluginKey: new PluginKey('hashtag'),
      char: '#',
    },
    HTMLAttributes: {
      class: 'hashtag',
    },
  }),
  Placeholder.configure({
    placeholder: placeholder,
  }),
]

const clientParagraphSchema = paragraphSchema.omit({ content: true }).merge(
  z.object({
    content: paragraphContentSchema.optional(),
  })
)

const clientMediaSchema = mediaSchema.omit({ attrs: true }).merge(
  z.object({
    attrs: z.object({
      src: z.string(),
      alt: z.string().optional().nullable(),
      title: z.string().optional().nullable(),
    }),
  })
)

export function serializeForServer(
  content: JSONContent,
  uploadResults: { url: string; id: string }[]
): TipTapSchema.Doc {
  return docSchema
    .omit({ content: true })
    .merge(
      z.object({
        content: z.array(
          clientParagraphSchema.or(
            clientMediaSchema.transform((media) => {
              const uploadResult = uploadResults.find(
                (image) => image.url === media.attrs.src
              )
              if (!uploadResult)
                throw new Error('No upload result found for post')
              return {
                type: 'media' as const,
                attrs: {
                  id: uploadResult.id,
                  alt: media.attrs.alt || undefined,
                  title: media.attrs.title || undefined,
                },
              }
            })
          )
        ),
      })
    )
    .transform((doc) => {
      return {
        ...doc,
        content: doc.content.filter((content) => {
          if (content.type === 'media') return true
          return (
            content.type === 'paragraph' &&
            typeof content.content !== 'undefined'
          )
        }) as TipTapSchema.Doc['content'],
      }
    })
    .parse(content)
}
