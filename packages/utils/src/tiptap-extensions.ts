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
import { EditorState, Plugin, PluginKey } from '@tiptap/pm/state'
import { mergeAttributes } from '@tiptap/react'
import { z } from 'zod'
import {
  Doc,
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
  addProseMirrorPlugins(this) {
    const options = this.options || {}
    const name = this.name

    const removeFileGridItem = (src: string) => options.removeFile?.(src)

    return [
      new Plugin({
        key: new PluginKey('eventHandler'),
        props: {
          handleDrop(view, event, slice, moved) {
            function safePos(state: EditorState, pos: number) {
              if (pos < 0) return 0
              return Math.min(state.doc.content.size, pos)
            }

            const { schema } = view.state
            const nodeType = schema.nodes[name]

            if (moved || !nodeType) return false

            //If already a node, get src attr (if not, try from datatransfer)
            const imageNode = slice?.content.firstChild?.attrs?.src
              ? slice.content.firstChild
              : null

            const src = imageNode
              ? imageNode.attrs?.src
              : event.dataTransfer?.getData('text')

            if (!src) return false

            const newNode = nodeType.create({
              src: src,
            })

            //Remove original file from gallery (if dragged from gallery)
            removeFileGridItem(src)

            const insertNode = imageNode || newNode

            const insertAt = safePos(
              view.state,
              view.posAtCoords({
                left: event.clientX,
                top: event.clientY,
              })?.pos || 0
            )

            view.dispatch(view.state.tr.insert(insertAt, insertNode))

            return true
          },
        },
      }),
    ]
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
): Doc {
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
        }) as Doc['content'],
      }
    })
    .parse(content)
}
