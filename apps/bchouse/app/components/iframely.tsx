import { useQuery } from '@tanstack/react-query'
// import { useDebounce } from 'usehooks-ts'
import { z } from 'zod'
import { Theme, useClientTheme } from './theme-provider'
import { classnames } from './utils/classnames'

const KEY = '8fb648a43d7cabada3cae0e30ac0322b'

export default function Iframely({
  url,
  isScrolling,
  allowFullHeight,
}: {
  url: string
  isScrolling?: boolean
  allowFullHeight?: boolean
}) {
  const debouncedIsScrolling = false //useDebounce(isScrolling, 500)
  const [theme] = useClientTheme()

  const { data, error, isLoading } = useQuery({
    queryKey: ['embed', url, allowFullHeight, theme],
    queryFn: () => {
      return fetch(
        `https://cdn.iframe.ly/api/iframely?url=${encodeURIComponent(
          url
        )}&key=${KEY}&iframe=1&${
          !allowFullHeight ? 'media=0' : ''
        }&omit_script=1&card=small&theme=${
          theme === Theme.LIGHT ? 'light' : 'dark'
        }`
      )
        .then((res) => res.json())
        .then((res) => {
          const result = z
            .object({
              html: z.string(),
            })
            .or(
              z.object({
                error: z.number(),
                message: z.string(),
              })
            )
            .safeParse(res)

          if (!result.success) {
            throw {
              code: 500,
              message: 'Failed to parse error',
            }
          } else if ('error' in result.data) {
            throw {
              code: result.data.error,
              message: result.data.message,
            }
          } else {
            return { __html: result.data.html }
          }
        })
    },
    enabled: !!url && !debouncedIsScrolling,
    gcTime: 1000 * 60,
    staleTime: 1000 * 60 * 5,
  })

  if (error) {
    return (
      <div className="overflow-hidden text-sm border border-[.5px] border-gray-200 dark:border-gray-700 rounded-xl min-height-[148px] aspect-[9/3] p-2">
        Error loading.
      </div>
    )
  } else if (!data || isLoading) {
    return (
      <div className="overflow-hidden text-sm border border-[.5px] border-gray-200 dark:border-gray-700 rounded-xl min-height-[148px] aspect-[9/3] p-2">
        Loading…
      </div>
    )
  } else {
    return (
      <div
        className={classnames(
          'flex flex-col justify-center overflow-hidden rounded-xl [&_iframe]:rounded-xl',
          !allowFullHeight && 'aspect-[9/3]'
        )}
        dangerouslySetInnerHTML={data}
      />
    )
  }
}
