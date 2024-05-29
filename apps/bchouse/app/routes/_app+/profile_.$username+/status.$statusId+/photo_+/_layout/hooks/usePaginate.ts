import { useLocation, useNavigate, useParams } from '@remix-run/react'
import { useMemo } from 'react'
import { $path } from 'remix-routes'

export function usePaginate(items: Array<any>) {
  const location = useLocation()
  const navigate = useNavigate()
  const { statusId, username, index } = useParams<{
    username: string
    statusId: string
    index: string
  }>()

  const delta = location.state?.delta as number | undefined
  const direction = location.state?.direction as -1 | 1 | undefined
  const photoNum = Number(index!)
  const imageIndex = photoNum - 1
  const hasPrevious = !!items[imageIndex - 1]
  const hasNext = !!items[imageIndex + 1]

  return useMemo(() => {
    return {
      hasPrevious,
      hasNext,
      photoNum,
      delta,
      direction,
      paginate: (direction: -1 | 1) => {
        if ((direction === -1 && hasPrevious) || (direction === 1 && hasNext)) {
          navigate(
            $path('/profile/:username/status/:statusId/photo/:index', {
              statusId: statusId!,
              username: username!,
              index: photoNum + direction,
            }),
            {
              state: {
                delta: typeof delta !== 'undefined' ? delta + 1 : undefined,
                direction,
              },
            }
          )
        }
      },
    }
  }, [hasPrevious, hasNext, photoNum, delta, direction, statusId, username])
}
