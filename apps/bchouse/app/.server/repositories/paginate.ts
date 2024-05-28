import { ReferenceExpression, SelectQueryBuilder } from 'kysely'
import { Cursor } from './types'

export async function paginate<DB, TB extends keyof DB, O>(
  query: SelectQueryBuilder<DB, TB, O>,
  idRef: ReferenceExpression<DB, TB>,
  createdAtRef: ReferenceExpression<DB, TB>,
  cursor: Cursor | undefined,
  limit = 20,
  getCursor: (lastResult: O) => Cursor
): Promise<{ results: O[]; nextCursor: Cursor | undefined }> {
  limit = limit + 1
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
        if (!lastResult) {
          throw new Error('Unexpected pagination error: last result undefined')
        }

        nextCursor = getCursor(lastResult)
      }

      return { results, nextCursor }
    })
}
