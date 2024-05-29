import { useLocation, useParams } from '@remix-run/react'
import { motion } from 'framer-motion'
import { ImageProxy } from '~/components/image-proxy'
import { usePostQuery } from './_layout/hooks/usePostQuery'

const variants = {
  enter: (direction: number) => {
    return {
      x: direction > 0 ? '200%' : '-200%',
      y: '-50%',
      opacity: 0,
    }
  },
  center: {
    zIndex: 0,
    x: '-50%',
    y: '-50%',
    opacity: 1,
  },
  exit: (direction: number) => {
    return {
      zIndex: 0,
      x: direction < 0 ? '200%' : '-200%',
      y: '-50%',
      opacity: 0,
    }
  },
}

const MotionComponent = motion(ImageProxy)

export default function Page() {
  const { data } = usePostQuery()
  const params = useParams()
  const imageIndex = Number(params.index as string) - 1
  const direction = useLocation().state?.direction as -1 | 1 | undefined

  const { mainPost } = data || {}

  const image = mainPost?.mediaUrls[imageIndex] as NonNullable<
    NonNullable<typeof mainPost>['mediaUrls'][number]
  >

  if (!image) return null

  return (
    <MotionComponent
      key={imageIndex}
      variants={variants}
      custom={direction}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{
        x: { type: 'just', bounce: 0, duration: 0.2 },
        opacity: { duration: 0.2 },
      }}
      mediaKey={image.url}
      className="absolute left-1/2 top-1/2 -translate-y-1/2 -translate-x-1/2 max-w-full max-h-full"
    ></MotionComponent>
  )
}
