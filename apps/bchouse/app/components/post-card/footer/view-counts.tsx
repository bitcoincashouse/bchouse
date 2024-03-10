import { ChartBarIcon } from '@heroicons/react/24/outline'
import { PostCardModel } from '~/components/post/types'

export function ViewCounts({ item }: { item: PostCardModel }) {
  return (
    <span
      className="inline-flex gap-1 items-center"
      onClick={(e) => e.stopPropagation()}
    >
      <ChartBarIcon className="w-5 h-5" />
      {item.viewCount && <span>{item.viewCount}</span>}
    </span>
  )
}
