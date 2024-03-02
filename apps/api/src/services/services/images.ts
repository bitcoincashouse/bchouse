import AWS from 'aws-sdk'
import { UploadRequestType } from '../db/index'

const STORAGE_ACCESS_KEY = process.env.STORAGE_ACCESS_KEY as string
const STORAGE_SECRET_KEY = process.env.STORAGE_SECRET_KEY as string
const STORAGE_BUCKET = process.env.STORAGE_BUCKET as string
const STORAGE_PUBLIC_URL = process.env.STORAGE_PUBLIC_URL as string
const STORAGE_API_URL = process.env.STORAGE_API_URL as string

if (
  !(
    STORAGE_ACCESS_KEY &&
    STORAGE_SECRET_KEY &&
    STORAGE_BUCKET &&
    STORAGE_PUBLIC_URL &&
    STORAGE_API_URL
  )
) {
  throw new Error(`Storage is missing required configuration.`)
}

export {
  STORAGE_ACCESS_KEY,
  STORAGE_API_URL,
  STORAGE_BUCKET,
  STORAGE_PUBLIC_URL,
  STORAGE_SECRET_KEY,
}

const STORAGE_REGION = process.env.STORAGE_REGION
const s3ForcePathStyle = process.env.STORAGE_PATH_STYLE === 'true'

export const getS3Instance = () =>
  new AWS.S3({
    credentials: {
      accessKeyId: STORAGE_ACCESS_KEY,
      secretAccessKey: STORAGE_SECRET_KEY,
    },
    region: STORAGE_REGION,
    endpoint: STORAGE_API_URL,
    s3ForcePathStyle: s3ForcePathStyle,
  })

export async function getPresignedPost(
  type: UploadRequestType,
  userId: string,
  imageId: string
) {
  const key = type + '/' + userId + '/' + imageId
  const presignedPost = getS3Instance().createPresignedPost({
    Bucket: STORAGE_BUCKET,
    Fields: {
      Key: key,
    },
    Expires: 5 * 60 * 60, //5 minutes,
    Conditions: [
      ['content-length-range', 0, 10000000], //10MB
      { bucket: STORAGE_BUCKET },
      ['starts-with', '$key', key],
    ],
  })

  return presignedPost
}

export async function getMediaExists(key: string) {
  const s3 = getS3Instance()
  const exists = await s3
    .headObject({ Bucket: STORAGE_BUCKET, Key: key })
    .promise()
    .then(() => true)
    .catch(() => false)
  return exists
}

export async function validateImageUploadRequest(key: string | undefined) {
  if (!key) return undefined

  const exists = await getMediaExists(key)
  if (!exists) throw new Error('Media does not exist in staging bucket')

  //TODO: Check if image is valid
  return key
}

export async function createDefaultCoverImage() {
  const promises = []

  for (let i = 0; i < 10; i++) {
    promises.push(
      fetch('https://picsum.photos/800/600').then(async (res) => {
        return getS3Instance()
          .upload({
            Bucket: STORAGE_BUCKET,
            Key: `DEFAULT_COVER_PHOTO/${i}.jpg`,
            Body: new Uint8Array(await res.arrayBuffer()),
          })
          .promise()
      })
    )
  }

  await Promise.all(promises)
}

export async function setDefaultCoverImage(userId: string) {
  const imageId = v4()
  const s3 = getS3Instance()
  const key = 'COVER_PHOTO' + '/' + userId + '/' + imageId

  //Move object to public bucket
  const defaultImageId = Math.floor(Math.random() * 10)

  await s3
    .copyObject({
      Bucket: STORAGE_BUCKET,
      CopySource: `${STORAGE_BUCKET}/DEFAULT_COVER_PHOTO/${defaultImageId}.jpg`,
      Key: key,
    })
    .promise()

  return imageId
}

export async function setMediaPublic(key: string | undefined) {
  if (!key) return undefined

  const s3 = getS3Instance()

  //Check if object exists in staging bucket
  const exists = await getMediaExists(key)

  if (!exists) {
    throw new Error('Media does not exist in staging bucket')
  }

  //Move object to public bucket
  await s3
    .putObjectAcl({
      Bucket: STORAGE_BUCKET,
      Key: key,
      ACL: 'public-read',
    })
    .promise()

  return key
}

import type { UploadHandler } from '@remix-run/node'
import { writeAsyncIterableToWritable } from '@remix-run/node'
import { PassThrough } from 'stream'
import { v4 as uuidv4, v4 } from 'uuid'
import { logger } from '../../app/utils/logger'

const getUploadStream = (Bucket: string, Key: string) => {
  const s3 = getS3Instance()
  const pass = new PassThrough()
  return {
    writeStream: pass,
    promise: s3.upload({ Bucket, Key, Body: pass }).promise(),
  }
}

const fileExists = (Key: string) => {
  const s3 = getS3Instance()
  return s3.headObject({ Bucket: STORAGE_BUCKET, Key }).promise()
}

export const upload = async (
  bucket: string,
  key: string,
  data: AsyncIterable<Uint8Array>
) => {
  const { writeStream, promise } = getUploadStream(bucket, key)
  await writeAsyncIterableToWritable(data, writeStream)
  await promise
}

export function getUploadId(
  prefix: string,
  formData: Record<string, FormDataEntryValue>
) {
  const value =
    formData[`${prefix}_upload`] ||
    formData[`${prefix}_upload_mobile`] ||
    formData[`${prefix}_upload_desktop`]
  const stringVal =
    typeof value === 'string' && value.startsWith(`${prefix}/`)
      ? value
      : undefined
  return stringVal
}

export function getUploadUrl(key: string | null | undefined) {
  //TODO: Placeholder depending on key or prefix?
  if (key) return `${STORAGE_PUBLIC_URL}/${STORAGE_BUCKET}/${key}`
  return undefined
}

export async function checkUploadUrl(
  prefix: string,
  objectId: string | undefined | null,
  userId: string
) {
  if (!objectId) return undefined
  const path = `${prefix}/${objectId}/${userId}`
  const url = `${STORAGE_PUBLIC_URL}/${STORAGE_BUCKET}/${path}`

  try {
    await fileExists(path)
    return url
  } catch (err) {
    const errMsg = typeof err === 'string' ? err : (err as any)?.message || ''
    logger.error(errMsg)
  } finally {
    return undefined
  }
}

export function s3UploadHandler({
  contentTypes = ['image/png', 'image/jpeg'],
  userId,
  prefixes,
}: {
  contentTypes: string[]
  userId: string
  prefixes: string[]
}) {
  //For every upload, Remix calls this function
  const uploadHandler: UploadHandler = async function ({
    contentType,
    name,
    data,
    filename,
  }) {
    const foundKey = prefixes.find((key) =>
      [
        `${key}_upload`,
        `${key}_upload_mobile`,
        `${key}_upload_desktop`,
      ].includes(name)
    )

    //If the uploaded file contentType is whitelisted by caller
    //And key of the uploaded file in body is a whitelisted
    // (variable | variable_mobile | variable_desktop)
    if (filename && foundKey && contentTypes?.includes?.(contentType)) {
      const uuid = uuidv4()
      //Upload the file to S3 using the prefix + random id + user uploading ID
      const uploadKey = `${foundKey}/${uuid}/${userId}`
      await upload(STORAGE_BUCKET, uploadKey, data)
      return uploadKey
    }

    return undefined
  }

  return uploadHandler
}
