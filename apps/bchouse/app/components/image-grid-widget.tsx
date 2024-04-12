import { useNavigate } from '@remix-run/react'
import { $path } from 'remix-routes'
import { ImageProxy } from '~/components/image-proxy'
import { cn } from '~/utils/cn'

export function ImageGridWidget({
  images,
  username,
}: {
  images: Array<{
    url: string
    postId: string
    idx: number
  }>
  username: string
}) {
  const navigate = useNavigate()

  return (
    <section aria-labelledby="media-list">
      <div className="overflow-hidden rounded-lg bg-gray-50">
        {!!images.length && (
          <div className="overflow-hidden relative">
            <div className={'pb-[56.25%]'}></div>
            <div
              className={cn(
                'absolute inset-0 grid grid-cols-6 grid-rows-2 rounded-lg'
              )}
            >
              {images.slice(0, 6).map((image, i, arr) => {
                let gridClass

                if (arr.length <= 2) {
                  gridClass = 'col-span-3 row-span-2'
                } else if (arr.length === 3) {
                  gridClass =
                    i === 0 ? 'col-span-3 row-span-2' : 'col-span-3 row-span-1'
                } else if (arr.length === 4) {
                  gridClass = 'col-span-3 row-span-1'
                } else {
                  gridClass = 'col-span-2 row-span-1'
                }

                return (
                  <div
                    key={image.url}
                    className={cn(
                      'overflow-hidden relative w-full h-full',
                      gridClass
                    )}
                    onClick={() =>
                      navigate(
                        $path(
                          '/profile/:username/status/:statusId/photo/:index',
                          {
                            index: image.idx,
                            statusId: image.postId,
                            username: username,
                          }
                        )
                      )
                    }
                  >
                    <ImageProxy
                      mediaKey={image.url}
                      quality={100}
                      width={200}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
