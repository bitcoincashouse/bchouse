import React, { useMemo } from 'react'

export type Focus =
  | 'center'
  | 'top'
  | 'left'
  | 'bottom'
  | 'right'
  | 'top_left'
  | 'top_right'
  | 'bottom_left'
  | 'bottom_right'

export type Aspect = `${number}:${number}`
export const ImageProxy = React.forwardRef<
  HTMLImageElement,
  {
    mediaKey: string
    quality?: number
    width?: number
    height?: number
    focus?: Focus
    aspectRatio?: Aspect
    onImageLoaded?: (width: number, height: number) => void
  } & React.ImgHTMLAttributes<HTMLImageElement>
>(
  (
    {
      mediaKey,
      width,
      height,
      quality,
      aspectRatio,
      onImageLoaded,
      focus,
      ...props
    },
    ref
  ) => {
    const proxySrc = useMemo(() => {
      const widthPart = width ? `w-${width}` : ''
      const heightPart = height ? `h-${height}` : ''
      const aspectPart = aspectRatio
        ? `ar-${aspectRatio.replace(':', '-')}`
        : ''
      const qualityPart = quality ? `q-${quality}` : ''
      const focusPart = focus ? `fo-${focus}` : ''

      const query = [widthPart, heightPart, aspectPart, qualityPart, focusPart]
        .filter(Boolean)
        .join(',')
      const tr = query ? `tr:${query}` : ''

      const path = [tr, mediaKey].join('/')
      return `https://ik.imagekit.io/2lyf1hd09/${path}`
    }, [mediaKey, width, height, aspectRatio, quality, focus])

    return (
      <img
        src={proxySrc}
        {...props}
        ref={ref}
        onLoad={(e) => {
          const image = e.currentTarget as HTMLImageElement
          const imageWidth = image.width
          const imageHeight = image.height
          onImageLoaded?.(imageWidth, imageHeight)
        }}
      />
    )
  }
)
