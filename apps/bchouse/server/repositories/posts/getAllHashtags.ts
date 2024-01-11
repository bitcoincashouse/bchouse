import { db } from '../../db/index.js'

export async function getAllHashtags() {
  return db
    .selectFrom('Hashtag')
    .groupBy('hashtag')
    .select(['hashtag', (eb) => eb.fn.count('Hashtag.postId').as('postCount')])
    .execute()
}
