import { db, UploadRequestType } from '../db/index'
import { v4 as uuid } from 'uuid'
export async function createUploadRequests(
  userId: string,
  params:
    | {
        type: 'coverPhoto'
        count?: undefined
      }
    | {
        type: 'post'
        count: number
      }
) {
  const requests =
    params.type === 'coverPhoto'
      ? [
          {
            type: 'COVER_PHOTO' as const,
            userId,
            updatedAt: new Date(),
            id: uuid(),
          },
        ]
      : Array.from({ length: params.count }).map((t) => ({
          type: 'POST' as const,
          userId,
          updatedAt: new Date(),
          id: uuid(),
        }))

  await db.insertInto('UploadRequest').values(requests).execute()

  return db
    .selectFrom('UploadRequest')
    .where(
      'UploadRequest.id',
      'in',
      requests.map((r) => r.id)
    )
    .selectAll()
    .execute()
    .then((rows) => {
      return rows.map((uploadRequest) => ({
        id: uploadRequest.id,
        type: uploadRequest.type,
        userId: uploadRequest.userId,
        key: `${uploadRequest.type}/${uploadRequest.userId}/${uploadRequest.id}`,
        createdAt: uploadRequest.createdAt,
        updatedAt: uploadRequest.updatedAt,
      }))
    })
}
