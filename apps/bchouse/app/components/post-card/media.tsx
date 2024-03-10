import { useNavigate } from '@remix-run/react'
import { Fragment, useMemo, useState } from 'react'
import { $path } from 'remix-routes'
import Iframely from '~/components/post/iframely'
import { Aspect, ImageProxy } from '../image-proxy'
import { PostCardModel } from '../post/types'
import { classNames } from '../utils'
import { usePost } from './context'

function FileGridView({
  urls,
  showFullLength,
  post,
}: {
  showFullLength?: boolean
  urls: {
    url: string
    height: number
    width: number
  }[]
  post: PostCardModel
}) {
  const aspectRatio = useMemo(() => {
    if (urls.length === 1) {
      const url = urls[0] as NonNullable<(typeof urls)[number]>
      return Math.min(url.height / url.width, 1.33) * 100 + '%'
    }
    return '56.25%'
  }, [urls])

  const [padding, setPadding] = useState(aspectRatio)
  const navigate = useNavigate()

  return (
    <>
      <div style={{ paddingBottom: padding }}></div>
      <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 gap-4">
        {urls.map(({ url: key, height, width }, i, arr) => {
          let gridClass
          let aspect: Aspect

          if (i >= 4) {
            //All images after 4th render nothing
            return <Fragment key={i}></Fragment>
          } else if (arr.length === 1) {
            gridClass = 'col-span-2 row-span-2'
            aspect = `${width}:${height}`
          } else if (arr.length === 2) {
            gridClass = 'col-span-1 row-span-2'
            aspect = '9:16'
          } else if (arr.length === 3) {
            if (i === 0) {
              gridClass = 'col-span-1 row-span-2'
              aspect = '9:16'
            } else {
              gridClass = 'col-span-1 row-span-1'
              aspect = '16:9'
            }
          } else {
            gridClass = 'col-span-1 row-span-1'
            aspect = '16:9'
          }

          return (
            <div
              key={i}
              className={classNames(
                'rounded-lg overflow-hidden relative w-full h-full',
                gridClass
              )}
            >
              {' '}
              {showFullLength ? (
                <ImageProxy
                  mediaKey={key}
                  className="object-cover w-full"
                  onClick={(e) => {
                    e.stopPropagation()
                    navigate(
                      {
                        pathname: $path(
                          '/profile/:username/status/:statusId/photo/:index',
                          {
                            username: post.person.handle,
                            statusId: post.id,
                            index: i + 1,
                          }
                        ),
                      },
                      {
                        state: {
                          delta: 1,
                        },
                      }
                    )
                  }}
                  onImageLoaded={(width, height) => {
                    if (urls.length === 1) {
                      const aspect = Number((height / width) * 100).toFixed(2)
                      setPadding(aspect + '%')
                    }
                  }}
                />
              ) : (
                <ImageProxy
                  mediaKey={key}
                  width={600}
                  quality={100}
                  aspectRatio={aspect}
                  focus={'center'}
                  className="object-cover w-full"
                  onClick={(e) => {
                    e.stopPropagation()
                    navigate(
                      {
                        pathname: $path(
                          '/profile/:username/status/:statusId/photo/:index',
                          {
                            username: post.person.handle,
                            statusId: post.id,
                            index: i + 1,
                          }
                        ),
                      },
                      {
                        state: {
                          delta: 1,
                        },
                      }
                    )
                  }}
                />
              )}
            </div>
          )
        })}
      </div>
    </>
  )
}

export function PostCardMedia({
  showFullLength,
  isScrolling,
}: {
  showFullLength?: boolean
  isScrolling?: boolean
}) {
  const item = usePost()

  return (
    <>
      {' '}
      {!!item.mediaUrls.length ? (
        <div className="overflow-hidden relative">
          <FileGridView
            urls={item.mediaUrls}
            showFullLength={showFullLength}
            post={item}
          />
        </div>
      ) : item.embed ? (
        <Iframely
          url={item.embed}
          isScrolling={isScrolling}
          allowFullHeight={showFullLength}
        />
      ) : null}
    </>
  )
}
