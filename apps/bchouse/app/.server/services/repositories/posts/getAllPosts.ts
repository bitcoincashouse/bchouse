import { jsonArrayFrom } from 'kysely/helpers/mysql'
import { db } from '../../db/index'

export async function getAllPosts() {
  return db
    .selectFrom('Post as post')
    .where(({ and, cmpr }) => and([cmpr('post.status', '=', 'PUBLISHED')]))
    .select([
      'post.id',
      'post.publishedById',
      'post.createdAt',
      'post.content',
      (eb) =>
        jsonArrayFrom(
          eb
            .selectFrom('Hashtag as h')
            .where('h.postId', '=', eb.ref('post.id'))
            .select('h.hashtag')
        ).as('hashtags'),
    ])
    .execute()
}
