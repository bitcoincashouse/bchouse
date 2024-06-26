import getSize from 'image-size'
import { db } from '../db'
import { paginate } from '../repositories/paginate'
import { Cursor } from '../repositories/types'
import { getUploadUrl } from '../services/images'
async function getMediaPaginated(params: {
  limit?: number
  cursor: Cursor | undefined
}) {
  const { cursor, limit = 20 } = params || {}

  return await paginate(
    db.selectFrom('Media as m').select(['m.id', 'm.createdAt', 'm.url']),
    'm.id',
    'm.createdAt',
    cursor,
    limit,
    (lastResult) => ({
      fromTimestamp: lastResult.createdAt,
      fromId: lastResult.id,
    })
  )
}

async function mapPaginatedQuery<T>(
  paginatedQuery: (cursor: Cursor | undefined) => Promise<{
    results: T
    nextCursor: Cursor | undefined
  }>,
  callback: (pageResults: T) => Promise<any | void>
) {
  let page = await paginatedQuery(undefined)
  await callback(page.results)

  while (page.nextCursor) {
    page = await paginatedQuery(page.nextCursor)
    await callback(page.results)
  }
}

export async function saveMediaAspectRatios() {
  return mapPaginatedQuery(
    (cursor) =>
      getMediaPaginated({
        limit: 100,
        cursor,
      }),
    async (media) => {
      const items = [] as { id: string; height?: number; width?: number }[]

      for (let i = 0; i < media.length; i++) {
        const item = media[i] as NonNullable<(typeof media)[number]>
        const url = getUploadUrl(item.url)
        if (url) {
          const image = Buffer.from(await (await fetch(url)).arrayBuffer())
          const size = getSize(image)
          items.push({ id: item.id, height: size.height, width: size.width })
        }
      }

      return db.transaction().execute(async (trx) =>
        Promise.all(
          items.map(async (media) => {
            if (media.height && media.width) {
              await trx
                .updateTable('Media')
                .set({ height: media.height, width: media.width })
                .where('id', '=', media.id)
                .execute()
            }
          })
        )
      )
    }
  )
}
