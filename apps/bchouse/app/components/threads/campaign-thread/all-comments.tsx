import React from 'react'
import { Virtuoso, VirtuosoHandle } from 'react-virtuoso'
import { CurrentUser } from '~/components/context/current-user-context'
import { ThreadPost } from '../../post/card/implementations/thread-card'
import { PostCardModel } from '../../post/types'
import { TimelineMessage } from '../timeline-message'
import { useFeedState } from '../useInfiniteScroll'

export function AllComments({
  childPosts,
  currentUser,
}: {
  childPosts: PostCardModel[]
  currentUser: CurrentUser
}) {
  const childFeedState = useFeedState({
    key: 'all_comments',
  })

  return childPosts.length ? (
    <Virtuoso
      ref={childFeedState.feedRef as React.MutableRefObject<VirtuosoHandle>}
      useWindowScroll
      restoreStateFrom={childFeedState.feedState}
      data={childPosts}
      itemContent={(index, post) => {
        return (
          <ThreadPost mainPostId={''} post={post} currentUser={currentUser} />
        )
      }}
    />
  ) : (
    <TimelineMessage
      message=" No posts yet"
      actionMessage={
        <p className="text-gray-400">
          When someone leaves a post, you’ll see it here.
        </p>
      }
    />
  )
}
