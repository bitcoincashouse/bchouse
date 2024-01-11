import { XMarkIcon } from '@heroicons/react/20/solid'
import { PaintBrushIcon } from '@heroicons/react/24/outline'
import { useState } from 'react'
import { classNames } from '~/utils/classNames'

import { Node } from '@tiptap/core'
import { EditorState, Plugin, PluginKey } from '@tiptap/pm/state'
import {
  NodeViewProps,
  NodeViewWrapper,
  ReactNodeViewRenderer,
  mergeAttributes,
} from '@tiptap/react'

// import type { RoleType } from '~/server/db/index'

function CustomImage({ node, extension, deleteNode }: NodeViewProps) {
  const src = node.attrs.src
  const [isDragging, setIsDragging] = useState(false)

  return (
    <NodeViewWrapper
      draggable
      data-type={extension.name}
      data-drag-handle=""
      contentEditable={false}
    >
      <div
        className={classNames(
          isDragging ? '[&>img]:opacity-10' : '',
          'rounded-lg overflow-hidden relative w-full h-full'
        )}
        draggable
        data-type="draggable-item"
        data-drag-handle=""
        contentEditable={false}
        onDragStart={(e) => {
          e.dataTransfer.setData('text/plain', src)
          setIsDragging(true)
        }}
        onDragEnd={() => setIsDragging(false)}
      >
        <div
          className="absolute right-3 top-2 p-1 bg-gray-800/90 hover:bg-gray-700/80 text-white rounded-full cursor-pointer"
          title="Remove"
          onClick={() => deleteNode()}
        >
          <XMarkIcon className="h-6 w-6" />
        </div>
        <div
          className="absolute right-3 bottom-2 p-2 bg-gray-800/90 hover:bg-gray-700/80 text-white rounded-full cursor-pointer"
          title="Edit"
          // onClick={() => setEditImageOpen(url)}
        >
          <PaintBrushIcon className="sm:hidden h-5 w-5" />
          <span className="hidden sm:block text-base font-bold px-2">Edit</span>
        </div>
        <img
          draggable={false}
          src={src}
          alt=""
          className="w-full h-full object-cover"
        />
      </div>
    </NodeViewWrapper>
  )
}

export const Media = Node.create({
  name: 'media',
  atom: true,
  group: 'block',
  draggable: true,
  defining: true,
  addNodeView() {
    return ReactNodeViewRenderer(CustomImage)
  },
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
