import {
  MagnifyingGlassMinusIcon,
  MagnifyingGlassPlusIcon,
} from '@heroicons/react/24/outline'
import React, { useEffect } from 'react'
import type { Area } from 'react-easy-crop'
import Cropper from 'react-easy-crop'
import { Modal } from '../../modal'

export function MediaCropper({
  image,
  onCropped,
  onClose,
}: {
  image: string
  onCropped: (crop: Blob | null, height: number, width: number) => void
  onClose: () => void
}) {
  const [crop, setCrop] = React.useState({ x: 0, y: 0 })
  const [zoom, setZoom] = React.useState(1)
  const [fit, setFit] = React.useState<
    'contain' | 'cover' | 'horizontal-cover' | 'vertical-cover' | undefined
  >('contain')

  const imageRef = React.useRef<HTMLImageElement | null>(null)
  const [completedCrop, setCompletedCrop] = React.useState<Area | undefined>()
  const [originalAspect, setOriginalAspect] = React.useState<number>()
  const [aspect, setAspect] = React.useState<number>()

  // useEffect(() => {
  //   if (imageRef.current && imageRef.current.naturalHeight) {
  //     setOriginalAspect(
  //       imageRef.current.naturalWidth / imageRef.current.naturalHeight
  //     )
  //     setAspect(imageRef.current.naturalWidth / imageRef.current.naturalHeight)
  //   }
  // }, [imageRef.current?.naturalHeight, imageRef.current?.naturalWidth])

  function onCropComplete(crop: Area) {
    if (!imageRef.current) {
      return
    }

    const image = imageRef.current
    const canvas = document.createElement('canvas')
    const scaleX = image.naturalWidth / image.width
    const scaleY = image.naturalHeight / image.height
    canvas.width = crop.width
    canvas.height = crop.height
    const ctx = canvas.getContext('2d')

    ctx?.drawImage(
      image,
      crop.x,
      crop.y,
      crop.width,
      crop.height,
      0,
      0,
      crop.width,
      crop.height
    )

    canvas.toBlob(
      (blob) => onCropped(blob, crop.height, crop.width),
      'image/jpeg',
      1
    )
    onClose()
  }

  useEffect(() => {
    if (originalAspect) {
      const id = setTimeout(() => {
        setAspect(originalAspect)
      }, 200)

      return () => clearTimeout(id)
    }

    return
  }, [originalAspect])

  return (
    <Modal
      open={true}
      size={'small'}
      titleSize={'2xl'}
      transition={'none'}
      title="Edit Media"
      action="Save"
      onAction={() => onCropComplete(completedCrop!)}
      onClose={onClose}
    >
      <div className="relative w-full bg-gray-200 flex-grow h-[75vh]">
        <Cropper
          image={image}
          crop={crop}
          zoom={zoom}
          showGrid={false}
          // restrictPosition={true}
          classes={{
            cropAreaClassName: '!border-4 !border-blue-400',
            containerClassName: '',
            // mediaClassName: '!w-full !h-auto',
          }}
          setImageRef={(r) => {
            imageRef.current = r.current
          }}
          aspect={aspect}
          onCropChange={setCrop}
          objectFit={fit}
          onCropComplete={(_, area) => setCompletedCrop(area)}
          onZoomChange={setZoom}
          onMediaLoaded={({ naturalHeight, naturalWidth }) => {
            const aspect = naturalWidth / naturalHeight
            setOriginalAspect(aspect)
            setAspect(aspect)
          }}
        />
      </div>
      <div className="flex px-12 py-8 items-center gap-3 justify-between">
        <button
          onClick={() => setAspect(originalAspect)}
          className="hover:bg-blue-50 rounded-full p-2"
          title="Original"
        >
          <div className="h-3 w-5 border border-2 border-gray-400 rounded-sm hover:border-blue-400"></div>
        </button>
        <button
          onClick={() => setAspect(1)}
          className="hover:bg-blue-50 rounded-full p-2"
          title="Square"
        >
          <div className="h-5 w-5 border border-2 border-gray-400 rounded-sm hover:border-blue-400"></div>
        </button>
        <button
          onClick={() => {
            setAspect(16 / 9)
          }}
          className="hover:bg-blue-50 rounded-full p-2"
          title="Wide"
        >
          <div className="h-2 w-5 border border-2 border-gray-400 rounded-sm hover:border-blue-400"></div>
        </button>
        <div className="flex flex-row items-center gap-2 text-gray-400">
          <MagnifyingGlassMinusIcon className="h-5 w-5" />
          <input
            type="range"
            value={zoom}
            min={1}
            max={3}
            step={0.1}
            aria-labelledby="Zoom"
            onChange={(e) => {
              setZoom(parseFloat(e.target.value))
            }}
            className="zoom-range"
          />
          <MagnifyingGlassPlusIcon className="h-5 w-5" />
        </div>
      </div>
    </Modal>
  )
}
