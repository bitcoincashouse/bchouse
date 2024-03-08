import { logger } from '@bchouse/utils'
import { serialize } from 'object-to-formdata'

export async function uploadCoverPhoto(coverPhotoFile: File) {
  const errors: Error[] = []
  const formData = new FormData()

  const results = await window.trpcClient.post.uploadMedia.mutate({
    type: 'coverPhoto',
  })

  const result = results.length && results[0]
  if (!result) {
    throw new Error('Invalid upload cover photo response')
  }

  const { form, type, key } = result

  const uploadRequestForm = serialize(form.fields)
  uploadRequestForm.append('file', coverPhotoFile)

  const response = await fetch(form.url, {
    method: 'POST',
    body: uploadRequestForm,
  }).catch((e) => ({ ok: false as const, statusText: e.message }))

  if (!response.ok) {
    logger.error(response.statusText)
    throw new Error('Error uploading files')
  }

  return key
}
