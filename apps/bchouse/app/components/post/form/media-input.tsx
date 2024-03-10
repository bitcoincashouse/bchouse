import { XMarkIcon } from '@heroicons/react/20/solid'
import { PaintBrushIcon } from '@heroicons/react/24/outline'
import React, { useMemo } from 'react'
import { classNames } from '../../utils'
import { MediaCropper } from './media-cropper'
import { Media } from './useFileActions'

export function MediaInput({
  files,
  onRemove,
  onCrop,
}: {
  onCrop: (oldUrl: string, newFile: Blob, height: number, width: number) => void
  onRemove: (file: string) => void
  files: Media[]
}) {
  const [editImageOpen, setEditImageOpen] = React.useState<string | undefined>()

  const aspectPadding = useMemo(() => {
    if (files.length === 1) {
      const { height, width } = files[0] as Media
      const aspect = Math.min((height / width) * 100, 133).toFixed(2)
      return aspect + '%'
    }

    return '56.25%'
  }, [files])

  return (
    <>
      {!!files.length && (
        <div className="overflow-hidden relative">
          <div style={{ paddingBottom: aspectPadding }}></div>
          <div
            className={classNames(
              'absolute inset-0 grid grid-cols-2 grid-rows-2 gap-4'
            )}
          >
            {files.map(({ url, height, width }, i, arr) => {
              let gridClass

              if (i >= 4) {
                return <></>
              } else if (arr.length === 1) {
                gridClass = 'col-span-2 row-span-2'
              } else if (arr.length === 2) {
                gridClass = 'col-span-1 row-span-2'
              } else if (arr.length === 3) {
                gridClass =
                  i === 0 ? 'col-span-1 row-span-2' : 'col-span-1 row-span-1'
              } else {
                gridClass = 'col-span-1 row-span-1'
              }

              return (
                <div
                  key={url}
                  className={classNames(
                    'media',
                    'rounded-lg overflow-hidden relative w-full h-full drag',
                    gridClass
                  )}
                  draggable
                  onDragEnd={(e) =>
                    e.currentTarget.classList.remove('[&>img]:opacity-10')
                  }
                  onDragStart={(e) => {
                    e.currentTarget.classList.add('[&>img]:opacity-10')
                    e.dataTransfer.setData('text/plain', url)
                  }}
                >
                  <div
                    className="absolute right-3 top-2 p-1 bg-gray-800/90 hover:bg-gray-700/80 text-white rounded-full cursor-pointer"
                    title="Remove"
                    onClick={() => onRemove(url)}
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </div>
                  <div
                    className="absolute right-3 bottom-2 p-2 bg-gray-800/90 hover:bg-gray-700/80 text-white rounded-full cursor-pointer"
                    title="Edit"
                    onClick={() => setEditImageOpen(url)}
                  >
                    <PaintBrushIcon className="sm:hidden h-5 w-5" />
                    <span className="hidden sm:block text-base font-bold px-2">
                      Edit
                    </span>
                  </div>
                  <img
                    draggable={false}
                    src={url}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </div>
              )
            })}
          </div>
        </div>
      )}

      {editImageOpen ? (
        <MediaCropper
          image={editImageOpen as string}
          onCropped={(crop, height, width) => {
            onCrop(editImageOpen as string, crop as Blob, height, width)
          }}
          onClose={() => setEditImageOpen(undefined)}
        />
      ) : null}
    </>
  )
}
