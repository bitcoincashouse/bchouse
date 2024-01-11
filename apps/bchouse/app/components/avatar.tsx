import { Fragment, useState } from 'react'
import { classNames } from '../utils/classNames'
import { ImageWithFallbackProps } from './image-with-fallback'

type AvatarProps = Omit<ImageWithFallbackProps, 'fallback'> & {
  className?: string
  src?: string
  square?: boolean
}

const AvatarWithFallback: React.FC<AvatarProps> = ({
  src,
  square,
  className = '',
  ...props
}) => {
  const [showFallback, setShowFallback] = useState(false)
  const showAvatar = !showFallback && !!src

  return (
    <Fragment>
      {showAvatar ? (
        <img
          {...props}
          onError={() => setShowFallback(true)}
          src={src}
          className={classNames(
            className,
            'aspect-[1/1]',
            !square && 'rounded-full',
            `flex-none bg-primary/10`
          )}
        />
      ) : (
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
      )}
    </Fragment>
  )
}
export const Avatar: React.FC<AvatarProps> = ({ src, ...props }) => {
  return (
    <Fragment key={src}>
      <AvatarWithFallback {...props} src={src} />
    </Fragment>
  )
}
