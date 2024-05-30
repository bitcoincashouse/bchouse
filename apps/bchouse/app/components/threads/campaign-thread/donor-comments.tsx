import React from 'react'
import { Virtuoso, VirtuosoHandle } from 'react-virtuoso'
import { DonorPost } from '~/components/thread-provider'
import { TimelineMessage } from '../timeline-message'
import { useFeedState } from '../useInfiniteScroll'
import { ContributionComment } from './contribution-comment'

export function DonorComments({ childPosts }: { childPosts: DonorPost[] }) {
  const childFeedState = useFeedState({
    key: 'donor_comments',
  })

  return childPosts.length ? (
    <Virtuoso
      ref={childFeedState.feedRef as React.MutableRefObject<VirtuosoHandle>}
      restoreStateFrom={childFeedState.feedState}
      className="grow"
      useWindowScroll
      data={childPosts}
      itemContent={(index, item) => {
        return <ContributionComment item={item} />
      }}
    />
  ) : (
    <TimelineMessage
      message=" No posts yet"
      actionMessage={
        <p className="text-gray-400">
          When a donor leaves a message, you’ll see it here.
        </p>
      }
    />
  )
}
