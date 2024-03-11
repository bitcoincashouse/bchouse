import { ReferenceExpression, SelectQueryBuilder, SqlBool } from 'kysely'
import { PostAudience, PostPublishState, PostType, db } from '../../db'
import { Cursor, PaginationCursorStyle } from '../types'
import { SqlNumber, selectors } from './selectors'
export type { Nullable } from 'node_modules/kysely/dist/esm/util/type-utils'

export const tables = {
  userPosts: db
    .selectFrom('Post as post')
    .innerJoin('User as publishedBy', 'publishedBy.id', 'post.publishedById')
    .select([
      ...selectors.post.all.filter((f) => f !== 'post.createdAt'),
      ...selectors.post.publishedBy,
      'post.createdAt as createdAt',
      'post.publishedById as repostedById',
      'publishedBy.username as repostedBy',
      selectors.flag(false).as('isRepost'),
    ]),
  userReposts: db
    .selectFrom('Reposts as repost')
    .innerJoin('Post as post', 'post.id', 'repost.postId')
    .innerJoin('User as publishedBy', 'publishedBy.id', 'post.publishedById')
    .innerJoin('User as repostedBy', 'repostedBy.id', 'repost.userId')
    .select([
      ...selectors.post.all.filter((f) => f !== 'post.createdAt'),
      ...selectors.post.publishedBy,
      'repost.createdAt as createdAt',
      'repost.userId as repostedById',
      'repostedBy.username as repostedBy',
      selectors.flag(true).as('isRepost'),
    ]),
  followingPosts: db
    .selectFrom('Post as post')
    .innerJoin(
      'Follows as following',
      'following.followedId',
      'post.publishedById'
    )
    .innerJoin('User as publishedBy', 'publishedBy.id', 'post.publishedById')
    .select([
      ...selectors.post.all.filter((f) => f !== 'post.createdAt'),
      ...selectors.post.publishedBy,
      'post.createdAt as createdAt',
      'post.publishedById as repostedById',
      'publishedBy.username as repostedBy',
      selectors.flag(false).as('isRepost'),
    ]),
  followingReposts: db
    .selectFrom('Follows as following')
    .innerJoin('Reposts as repost', 'repost.userId', 'following.followedId')
    .innerJoin('Post as post', 'post.id', 'repost.postId')
    .innerJoin('User as publishedBy', 'publishedBy.id', 'post.publishedById')
    .innerJoin('User as repostedBy', 'repostedBy.id', 'repost.userId')
    .select([
      ...selectors.post.all.filter((f) => f !== 'post.createdAt'),
      ...selectors.post.publishedBy,
      'repost.createdAt as createdAt',
      'repost.userId as repostedById',
      'repostedBy.username as repostedBy',
      selectors.flag(true).as('isRepost'),
    ]),
}

export async function paginate<
  DB,
  TB extends keyof DB,
  O extends {
    createdAt: Date
    id: string
  }
>(
  query: SelectQueryBuilder<DB, TB, O>,
  idRef: ReferenceExpression<DB, TB>,
  createdAtRef: ReferenceExpression<DB, TB>,
  cursor: Cursor | undefined,
  limit = 20,
  paginationStyle: PaginationCursorStyle = 'FIRST_OF_NEXT_PAGE'
): Promise<{ results: O[]; nextCursor: Cursor | undefined }> {
  limit = limit + 1
  // limit = paginationStyle === 'FIRST_OF_NEXT_PAGE' ? limit + 1 : limit
  return query
    .$if(!!cursor, (qb) =>
      qb.where((eb) =>
        eb.or([
          eb(createdAtRef, '<', cursor?.fromTimestamp as Date),
          eb.and([
            eb(createdAtRef, '=', cursor?.fromTimestamp as Date),
            eb(idRef, '<=', cursor?.fromId as string),
          ]),
        ])
      )
    )
    .orderBy(createdAtRef, 'desc')
    .orderBy(idRef, 'desc')
    .limit(limit)
    .execute()
    .then((results) => {
      let nextCursor: Cursor | undefined = undefined

      if (results.length === limit) {
        const lastResult = results.pop()
        // const lastResult = paginationStyle === 'FIRST_OF_NEXT_PAGE'
        //   ? //Remove last result if first of next page
        //     results.pop()
        //   : results[results.length - 1]

        if (!lastResult) {
          throw new Error('Unexpected pagination error: last result undefined')
        }

        nextCursor = {
          fromTimestamp: lastResult.createdAt,
          fromId: lastResult.id,
        }
      }

      return { results, nextCursor }
    })
}

// export type SelectPost = {
//   postId: string
//   id: string
//   type: PostType
//   publishedById: string
//   content: string
//   status: PostPublishState
//   audience: PostAudience
//   createdAt: Date
//   updatedAt: Date
//   viewCount: number
//   parentPostId: string
//   quotePostId: string
//   username: string
//   fullName: string
//   avatarUrl: string
//   repostedBy: string
//   isRepost: SqlBool
//   wasReposted: SqlBool
//   wasQuoted: SqlBool

//   mediaUrls: string[]
//   likes: number
//   quotePosts: number
//   comments: number
//   reposts: number
//   isThread: SqlBool
//   wasLiked: SqlBool
// }

export type SelectPost = {
  publishedById: string
  id: string
  type: PostType
  content: unknown
  status: PostPublishState
  audience: PostAudience
  createdAt: Date
  updatedAt: Date
  viewCount: number
  embed: string | null
  parentPostId: string | null
  parentPostPublishedById: string | null
  quotePostId: string | null
  postId: string
  mediaUrls:
    | {
        url: string
        height: number
        width: number
      }[]
    | null
  likes: SqlNumber | null
  quotePosts: SqlNumber | null
  comments: SqlNumber | null
  reposts: SqlNumber | null
  isThread: SqlBool
  username: string
  fullName: string | null
  avatarUrl: string | null
  isRepost: SqlBool
  repostedById: string
  repostedBy: string
  wasReposted: SqlBool
  wasQuoted: SqlBool
  wasLiked: SqlBool
}
