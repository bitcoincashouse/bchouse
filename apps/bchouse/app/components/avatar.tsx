import { Fragment, useState } from 'react'
import { useBrowserLayoutEffect } from '~/utils/useBrowserLayoutEffect'
import { classNames } from '../utils/classNames'
import { ImageWithFallbackProps } from './image-with-fallback'

type AvatarProps = Omit<ImageWithFallbackProps, 'fallback'> & {
  className?: string
  src?: string
  square?: boolean
}

async function isImageValid(src?: string) {
  if (!src) return false

  return new Promise((resolve) => {
    let img = document.createElement('img')
    img.onerror = () => resolve(false)
    img.onload = () => resolve(true)
    img.src = src
  })
}

function Fallback({
  className,
  square,
}: {
  className?: string
  square?: boolean
}) {
  return (
    <span
      className={classNames(
        className,
        'aspect-[1/1]',
        !square ? 'rounded-full' : '',
        `inline-block overflow-hidden bg-gray-100`
      )}
    >
      <svg
        className="h-full w-full text-gray-300"
        fill="currentColor"
        viewBox="0 0 24 24"
      >
        <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    </span>
  )
}

function reducer(
  state: any,
  action: 'IMAGE_LOADED' | 'IMAGE_ERROR' | 'IMAGE_RESET'
) {
  if (action === 'IMAGE_LOADED') {
    return {
      showFallback: false,
      hideImage: false,
    }
  } else if (action === 'IMAGE_ERROR') {
    return {
      showFallback: true,
      hideImage: false,
    }
  } else {
    return {
      showFallback: false,
      hideImage: true,
    }
  }
}

export const Avatar: React.FC<AvatarProps> = ({
  src,
  square,
  className = '',
  ...props
}) => {
  const [showFallback, setShowFallback] = useState(false)

  //Allow browser to detect breaking images when SSR (SSR fails to run onError)
  useBrowserLayoutEffect(() => {
    isImageValid(src).then((isValid) => {
      if (!isValid) {
        setShowFallback(true)
      }
    })
  }, [src])

  const imgClasses = classNames(
    className,
    'aspect-[1/1]',
    !square && 'rounded-full',
    `flex-none bg-primary/10`
  )

  return (
    <Fragment key={src}>
      {!showFallback ? (
        <>
          <img
            {...props}
            onError={() => setShowFallback(true)}
            src={src}
            className={imgClasses}
          />
        </>
      ) : (
        <Fallback className={className} square={square} />
      )}
    </Fragment>
  )
}
