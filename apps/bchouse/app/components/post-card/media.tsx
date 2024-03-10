import { View as FileGridView } from '~/components/post/file-grid'
import Iframely from '~/components/post/iframely'
import { usePost } from './context'

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
