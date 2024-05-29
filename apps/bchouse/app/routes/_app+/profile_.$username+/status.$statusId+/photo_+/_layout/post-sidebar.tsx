import { Thread } from '~/components/threads/thread'
import { usePostQuery } from './hooks/usePostQuery'

export function PostSidebar() {
  const { data } = usePostQuery()
  const { mainPost, previousCursor, nextCursor, posts = [] } = data || {}

  if (!mainPost) return null

  return (
    <div className="hidden lg:block pt-2 min-[690px]:block w-[290px] min-[1080px]:w-[350px] relative order-last">
      <div className="divide-y divide-gray-200 dark:divide-gray-800 pb-[80vh]">
        <div className="">
          <Thread
            showImagesMainPost={false}
            mainPost={mainPost}
            key={mainPost.id}
            previousCursor={previousCursor}
            nextCursor={nextCursor}
            initialPosts={posts}
          />
        </div>
      </div>
    </div>
  )
}
