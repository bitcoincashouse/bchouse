import { PhotoIcon } from '@heroicons/react/24/outline'
import { Editor, EditorContent, JSONContent, useEditor } from '@tiptap/react'
import React, { useEffect } from 'react'
import { ErrorBoundary } from 'react-error-boundary'
import { ClientOnly } from '~/components/client-only'
import { classNames } from '~/utils/classNames'
// import { EmojiPickerButton } from './emoji-picker-button'
import { Input as FileGrid } from './file-grid'
import { PostActions } from './post-actions'
import { getExtensions } from './tiptap-extensions'
import { Media, useFileActions } from './useFileActions'

export { PostInputWrapper as PostInput }

function PostInputWrapper(props: React.ComponentProps<typeof PostInput>) {
  const {
    placeholder = '',
    onFilesChange,
    editorRef,
    footer,
    onChange,
    initialFiles,
    ...editorProps
  } = props

  return (
    <>
      <ClientOnly
        fallback={
          <div className="relative flex flex-col gap-2">
            <div>
              <input
                type="text"
                disabled
                placeholder={props.placeholder}
                {...editorProps}
                className={classNames(
                  editorProps.className,
                  'placeholder-[#adb5bd]'
                )}
              ></input>
            </div>
            <div className="flex items-end gap-1">
              <div className="flex items-end gap-1">
                <label
                  className="text-blue-400 hover:bg-blue-50 rounded-full p-2"
                  title="Media"
                  htmlFor="media-input"
                >
                  <PhotoIcon className="h-5 w-5" />
                </label>
                {/* <EmojiPickerButton
                  className="text-blue-400 hover:bg-blue-50 rounded-full p-2"
                  title="Emoji"
                /> */}
                <button className="text-blue-400 hover:bg-blue-50 rounded-full p-2 font-semibold">
                  <span className="flex justify-center items-center h-5 w-5">
                    B
                  </span>
                </button>
                <button className="text-blue-400 hover:bg-blue-50 rounded-full p-2 font-semibold">
                  <span className="flex justify-center items-center h-5 w-5">
                    I
                  </span>
                </button>
              </div>
              {props.footer}
            </div>
          </div>
        }
      >
        {() => <PostInput {...props} />}
      </ClientOnly>
    </>
  )
}

function PostInput({
  placeholder = '',
  onFilesChange,
  editorRef,
  footer,
  onChange,
  initialFiles,
  ...props
}: {
  initialFiles?: Media[]
  editorRef?: React.MutableRefObject<Editor | null>
  placeholder?: string
  footer?: React.ReactNode
  onChange?: (json: JSONContent) => void
  onFilesChange?: (files: Media[]) => void
} & Omit<React.HTMLAttributes<HTMLDivElement>, 'ref' | 'onChange'>) {
  const { files, removeFile, addFile, replaceFile, clearFiles } =
    useFileActions(initialFiles)

  useEffect(() => {
    onFilesChange?.(files)
  }, [files])

  const editor = useEditor(
    {
      extensions: getExtensions(placeholder, removeFile),
      onUpdate: ({ editor }) => onChange?.(editor.getJSON()),
    },
    []
  )

  if (editorRef) {
    editorRef.current = editor
  }

  return (
    <div className="relative flex flex-col gap-2">
      <ErrorBoundary
        fallbackRender={(props) => {
          props.resetErrorBoundary()
          return <></>
        }}
      >
        <div>
          <EditorContent {...props} editor={editor} />
        </div>
      </ErrorBoundary>
      <FileGrid
        files={files}
        onRemove={(file: string) => removeFile(file)}
        onCrop={(url, newFile, height, width) =>
          replaceFile(url, newFile, height, width)
        }
      />
      <PostActions
        disableMedia={files.length >= 4}
        editor={editor}
        addFile={addFile}
        footer={footer}
      />
    </div>
  )
}
