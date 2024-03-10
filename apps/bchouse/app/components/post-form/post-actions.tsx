import { PhotoIcon } from '@heroicons/react/24/outline'
import { Editor } from '@tiptap/react'
import { useRef } from 'react'
import { classNames } from '~/utils/classNames'
// import { EmojiPickerButton } from './emoji-picker-button'

export function PostActions({
  editor,
  addFile,
  disableMedia,
  footer,
  className,
}: {
  className?: string
  editor: Editor | null
  footer?: React.ReactNode
  disableMedia?: boolean
  addFile: (file: File | undefined, height: number, width: number) => void
}) {
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  return (
    <div className={classNames(className, 'flex items-end gap-1')}>
      <div className="flex items-end gap-1 flex-wrap">
        <button
          className="text-blue-400 hover:bg-hover rounded-full p-2 disabled:hover:bg-transparent disabled:text-gray-500"
          disabled={disableMedia}
          title="Media"
          type="button"
          onClick={(e) => {
            fileInputRef.current?.click()
          }}
        >
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            multiple
            ref={fileInputRef}
            className="hidden"
            value={''}
            onChange={(e) => {
              Array.from(e.target.files || []).forEach((file: File) => {
                if (file) {
                  const reader = new FileReader()

                  reader.onload = function (e) {
                    const image = new Image()
                    image.src = e.target?.result as string

                    image.onload = function () {
                      const image = this as HTMLImageElement
                      const imageWidth = image.width
                      const imageHeight = image.height

                      addFile(file, imageHeight, imageWidth)
                    }
                  }

                  reader.readAsDataURL(file)
                }
              })
            }}
          />
          <PhotoIcon className="h-5 w-5" />
        </button>
        {/* <button
          className="text-blue-400 hover:bg-hover rounded-full p-2"
          title="Poll"
          onClick={(e) => e.preventDefault()}
        >
          <ChartPieIcon className="h-5 w-5" />
        </button> */}
        {/* <EmojiPickerButton
          className="text-blue-400 hover:bg-hover rounded-full p-2"
          title="Emoji"
        /> */}
        <button
          type="button"
          className={classNames(
            editor?.isActive('bold') ? 'bg-hover' : '',
            'text-blue-400 hover:bg-hover rounded-full p-2 font-semibold'
          )}
          onClick={(e) => {
            editor?.chain().focus().toggleBold().run()
          }}
        >
          <span className="flex justify-center items-center h-5 w-5">B</span>
        </button>
        <button
          type="button"
          className={classNames(
            editor?.isActive('italic') ? 'bg-hover' : '',
            'text-blue-400 hover:bg-hover rounded-full p-2 italic'
          )}
          onClick={(e) => {
            editor?.chain().focus().toggleItalic().run()
          }}
        >
          <span className="flex justify-center items-center h-5 w-5">I</span>
        </button>
      </div>
      {footer}
    </div>
  )
}
