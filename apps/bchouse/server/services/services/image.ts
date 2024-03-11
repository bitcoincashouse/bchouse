import { createUploadRequests } from '../repositories/media'
import { getPresignedPost } from './images'

export class ImageService {
  async createUploadRequest(
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
    const uploadRequests = await createUploadRequests(userId, params)

    //Get presigned post from S3
    return await Promise.all(
      uploadRequests.map(async ({ type, userId, id: imageId, key }) => {
        const form = await getPresignedPost(type, userId, imageId)
        return { form, key, id: imageId, type }
      })
    )
  }
}
