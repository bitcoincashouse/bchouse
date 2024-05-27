import { v4 as uuid } from 'uuid'
import { db, UploadRequestType } from '../../db/index'
export async function createUploadRequests(
  userId: string,
  types: UploadRequestType[]
) {
  const requests = types.map((t) => ({
    type: t,
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
