import {
  Doc,
  docSchema,
  mediaSchema,
  paragraphContentSchema,
  paragraphSchema,
} from '@bchouse/utils'
import { JSONContent } from '@tiptap/core'
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
import { Editor, ReactRenderer } from '@tiptap/react'
import tippy, { Instance as TippyInstance } from 'tippy.js'
import { z } from 'zod'
import { typesenseClient } from '~/utils/typesense.client'
import { HashtagList, HashtagListRef } from './editor/hashtag-list'
import { Media } from './editor/media'
import { MentionList, MentionListRef } from './editor/mention-list'

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
      items: async ({ query, editor }) => {
        return await typesenseClient
          .collections<{
            id: string
            user_username: string
            user_fullname: string
            user_avatarUrl: string
            user_createdAt: string
            user_projects: {
              projectId: string
              // role: RoleType & 'ADMIN'
            }[]
          }>('users')
          .documents()
          .search({
            q: query,
            query_by: 'user_username,user_fullname',
            per_page: 5,
            preset: '',
          })
          .then(({ hits = [] }) => {
            return hits.map(({ document }) => {
              return {
                id: document.id,
                label: document.user_username,
                username: document.user_username,
                fullName: document.user_fullname,
                avatarUrl: document.user_avatarUrl,
                createdAt: document.user_createdAt,
                bchAddress: '',
              }
            })
          })
      },
      render: () => {
        let component: ReactRenderer<MentionListRef> | undefined
        let popup: TippyInstance[] | undefined

        return {
          onStart: (props) => {
            component = new ReactRenderer(MentionList, {
              props,
              editor: props.editor,
            })

            if (!props.clientRect) {
              return
            }

            popup = tippy('body', {
              getReferenceClientRect: props.clientRect as () => DOMRect,
              appendTo: () => document.body,
              content: component.element,
              showOnCreate: true,
              interactive: true,
              trigger: 'manual',
              placement: 'bottom-start',
            })
          },

          onUpdate(props) {
            component?.updateProps(props)

            if (!props.clientRect) {
              return
            }

            popup?.[0]?.setProps({
              getReferenceClientRect: props.clientRect as () => DOMRect,
            })
          },

          onKeyDown(props) {
            if (props.event.key === 'Escape') {
              popup?.[0]?.hide()

              return true
            }

            if (!component?.ref) return false

            return component.ref.onKeyDown(props)
          },

          onExit() {
            popup?.[0]?.destroy()
            component?.destroy()
          },
        }
      },
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
      items: async ({ query, editor }) => {
        return await typesenseClient
          .collections<{
            id: string
            hashtag: string
          }>('hashtags')
          .documents()
          .search({
            q: query,
            query_by: 'hashtag',
            per_page: 5,
            preset: '',
          })
          .then(({ hits = [] }) => {
            return hits
              .map(({ document }) => {
                return {
                  hashtag: document.hashtag,
                  label: document.hashtag,
                }
              })
              .filter((d) => d.hashtag !== query)
              .concat(
                query
                  ? [
                      {
                        hashtag: query,
                        label: query,
                      },
                    ]
                  : []
              )
          })
      },
      render: () => {
        let component: ReactRenderer<HashtagListRef> | undefined
        let popup: TippyInstance[] | undefined

        return {
          onStart: (props) => {
            component = new ReactRenderer(HashtagList, {
              props,
              editor: props.editor,
            })

            if (!props.clientRect) {
              return
            }

            popup = tippy('body', {
              getReferenceClientRect: props.clientRect as () => DOMRect,
              appendTo: () => document.body,
              content: component.element,
              onHidden: () => {
                if (!component) return

                const editor: Editor = component.props.editor
                const props = component.props

                if (!props.query) return

                const node = editor.view.state.doc.nodeAt(
                  component.props.range.from
                )

                if (node?.type.name !== 'hashtag') {
                  props.command({
                    hashtag: props.query,
                    label: props.query,
                  })
                }
              },
              showOnCreate: true,
              interactive: true,
              trigger: 'manual',
              placement: 'bottom-start',
            })
          },
          onBeforeStart(props) {
            component?.updateProps(props)

            if (!props.clientRect) {
              return
            }

            const popupInstance = popup?.[0]
            if (!popupInstance) return

            if (!popupInstance.state.isVisible) {
              popupInstance.show()
            }
          },

          onUpdate(props) {
            component?.updateProps(props)

            if (!props.clientRect) {
              return
            }

            const popupInstance = popup?.[0]
            if (!popupInstance) return

            popupInstance.setProps({
              getReferenceClientRect: props.clientRect as () => DOMRect,
            })
          },

          onKeyDown(props) {
            if (props.event.key === 'Escape') {
              popup?.[0]?.hide()

              return true
            }

            if (!component?.ref) return false

            return component.ref.onKeyDown(props)
          },

          onExit() {
            popup?.[0]?.destroy()
            component?.destroy()

            popup = undefined
            component = undefined
          },
        }
      },
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
