import {
  AliasedExpression,
  AliasedSelectQueryBuilder,
  ExpressionBuilder,
  SqlBool,
  sql,
} from 'kysely'
import { jsonBuildObject } from 'kysely/helpers/mysql'
import { DB } from '../../db/index'

export type SqlNumber = string | number | bigint
type BooleanSelector<T extends string> = AliasedExpression<SqlBool, T>
type PostExpression = ExpressionBuilder<
  DB & {
    post: { id: string; createdAt: Date }
  },
  'post'
>

type MediaUrlsAgg = AliasedSelectQueryBuilder<
  {
    mediaUrls: {
      url: string
      height: number
      width: number
    }[]
  },
  'mediaUrls'
>

type LikesAgg = AliasedSelectQueryBuilder<
  {
    likes: SqlNumber
  },
  'likes'
>

type CommentsAgg = AliasedSelectQueryBuilder<
  {
    comments: SqlNumber
  },
  'comments'
>

type QuotePostAgg = AliasedSelectQueryBuilder<
  {
    quotePosts: SqlNumber
  },
  'quotePosts'
>

type RepostAgg = AliasedSelectQueryBuilder<
  {
    reposts: SqlNumber
  },
  'reposts'
>

type TipAmountAgg = AliasedSelectQueryBuilder<
  {
    tipAmount: SqlNumber
  },
  'tipAmount'
>

export const selectors = {
  post: {
    all: [
      'post.id as postId',
      'post.id',
      'post.type',
      'post.publishedById',
      'post.content',
      'post.status',
      'post.audience',
      'post.createdAt',
      'post.updatedAt',
      'post.viewCount',
      'post.parentPostId',
      'post.quotePostId',
      'post.embed',
    ] as const,
    publishedBy: [
      'publishedBy.fullName',
      'publishedBy.firstName',
      'publishedBy.lastName',
      'publishedBy.username',
      'publishedBy.avatarUrl',
      'publishedBy.bchAddress',
    ] as const,
  },
  flag: (flag: boolean) => sql.lit(flag ? 1 : 0).$castTo<SqlBool>(),
  wasReposted:
    (currentUserId: string | null) =>
    (qb: PostExpression): BooleanSelector<'wasReposted'> =>
      qb
        .exists((qb) =>
          qb
            .selectFrom('Reposts as repost')
            .where(({ and, cmpr, ref }) =>
              and([
                cmpr('repost.postId', '=', ref('post.id')),
                cmpr('repost.userId', '=', currentUserId),
              ])
            )
            .select('repost.id')
        )
        .as('wasReposted'),
  wasQuoted:
    (currentUserId: string | null) =>
    (qb: PostExpression): BooleanSelector<'wasQuoted'> =>
      qb
        .exists((qb) =>
          qb
            .selectFrom('Post as quotePost')
            .where(({ and, cmpr, ref }) =>
              and([
                cmpr('quotePost.quotePostId', '=', ref('post.id')),
                cmpr('quotePost.publishedById', '=', currentUserId),
              ])
            )
            .select('quotePost.id')
        )
        .as('wasQuoted'),
  wasLiked:
    (currentUserId: string | null) =>
    (qb: PostExpression): BooleanSelector<'wasLiked'> =>
      qb
        .exists((qb) =>
          qb
            .selectFrom('Likes as like')
            .select('like.id')
            .whereRef('like.postId', '=', 'post.id')
            .where('like.userId', '=', currentUserId)
        )
        .as('wasLiked'),
  wasTipped:
    (currentUserId: string | null) =>
    (qb: PostExpression): BooleanSelector<'wasTipped'> =>
      qb
        .exists((qb) =>
          qb
            .selectFrom('TipPayment as tip')
            .innerJoin('TipRequest as req', 'req.id', 'tip.tipId')
            .where((eb) =>
              eb
                .eb('req.postId', '=', eb.ref('post.id'))
                .and('req.userId', '=', currentUserId)
            )
            .select('tip.tipId')
        )
        .as('wasTipped'),
  mediaUrls: (qb: PostExpression): MediaUrlsAgg =>
    qb
      .selectFrom('Media as media')
      .whereRef('media.postId', '=', 'post.id')
      .orderBy('post.createdAt', 'desc')
      .limit(6)
      .select((qb) =>
        qb.fn
          .agg<
            {
              url: string
              height: number
              width: number
            }[]
          >('JSON_ARRAYAGG', [
            jsonBuildObject({
              url: qb.ref('media.url'),
              height: qb.ref('media.height'),
              width: qb.ref('media.width'),
            }),
          ])
          .as('mediaUrls')
      )
      .as('mediaUrls'),
  likes: (qb: PostExpression): LikesAgg =>
    qb
      .selectFrom('Likes as like')
      .select(qb.fn.count('id').as('likes'))
      .whereRef('like.postId', '=', 'post.id')
      .as('likes'),
  quotePosts: (qb: PostExpression): QuotePostAgg =>
    qb
      .selectFrom('Post as quotePost')
      .select(qb.fn.count('id').as('quotePosts'))
      .whereRef('quotePost.quotePostId', '=', 'post.id')
      .as('quotePosts'),
  comments: (qb: PostExpression): CommentsAgg =>
    qb
      .selectFrom('Post as comment')
      .select(qb.fn.count('id').as('comments'))
      .whereRef('comment.parentPostId', '=', 'post.id')
      .as('comments'),
  reposts: (qb: PostExpression): RepostAgg =>
    qb
      .selectFrom('Reposts as repost')
      .select(qb.fn.count('id').as('reposts'))
      .whereRef('repost.postId', '=', 'post.id')
      .as('reposts'),
  tipAmount: (qb: PostExpression): TipAmountAgg =>
    qb
      .selectFrom('TipPayment as tip')
      .innerJoin('TipRequest as request', 'request.id', 'tip.tipId')
      .whereRef('request.postId', '=', 'post.id')
      .select((eb) => eb.fn.sum('tip.satoshis').as('tipAmount'))
      .as('tipAmount'),
}
