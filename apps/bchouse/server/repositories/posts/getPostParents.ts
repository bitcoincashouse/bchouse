import { db } from '../../db/index'
import { Cursor } from '../types'
import { postRowMapper } from './mappers'
import { selectors } from './selectors'
import { KyselyPostDbModel } from './types'

export async function getPostParents(
  params: {
    id: string
    currentUserId: string | null
  } & Partial<Cursor>
): Promise<{
  results: KyselyPostDbModel[]
  previousCursor: Cursor | undefined
}> {
  const { id, currentUserId } = params
  const parentPosts = await db
    .selectFrom('Post as post')
    .innerJoin('User as publishedBy', 'publishedBy.id', 'post.publishedById')
    .select([
      ...selectors.post.all,
      ...selectors.post.publishedBy,
      selectors.wasReposted(currentUserId),
      selectors.wasQuoted(currentUserId),
      selectors.wasLiked(currentUserId),
      selectors.mediaUrls,
      selectors.likes,
      selectors.quotePosts,
      selectors.comments,
      selectors.reposts,
      'post.campaignId',
      selectors.wasTipped(currentUserId),
      selectors.tipAmount,
    ])
    .innerJoin('PostPaths as path', 'path.ancestorId', 'post.id')
    .where((eb) => eb('path.descendantId', '=', id).and('post.id', '<>', id))
    .orderBy('post.createdAt', 'asc')
    .execute()

  return {
    results: parentPosts.map((row) => postRowMapper(row)),
    previousCursor: undefined,
  }
}
