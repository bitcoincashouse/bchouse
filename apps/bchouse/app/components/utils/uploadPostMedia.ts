import { serialize } from 'object-to-formdata'

export async function uploadPostMedia(
  postImageUrls: string[],
  galleryImageUrls: string[]
) {
  //Get media upload presigned post requests
  const totalImageCount = galleryImageUrls.length + postImageUrls.length

  const results = totalImageCount
    ? await window.trpcClient.post.uploadMedia.mutate({
        type: 'post',
        count: totalImageCount,
      })
    : []

  if (!(results instanceof Array) || results.length !== totalImageCount)
    throw new Error('Mismatch media requests count.')

  async function upload(imageUrl: string) {
    const { form, key } = results.pop() as NonNullable<(typeof results)[number]>

    //Post each image blob to presigned form
    const file = await fetch(imageUrl).then((r) => r.blob())

    const uploadRequestForm = serialize(form.fields)
    uploadRequestForm.append('file', file)

    const response = await fetch(form.url, {
      method: 'POST',
      body: uploadRequestForm,
    })

    if (!response.ok) throw new Error('Error uploading image')

    return { url: imageUrl, id: key }
  }

  const [galleryImageResults, postImageResults] = await Promise.all([
    Promise.all(galleryImageUrls.map((image) => upload(image))),
    Promise.all(postImageUrls.map((image) => upload(image))),
  ])

  return {
    galleryImages: galleryImageResults,
    postImages: postImageResults,
  }
}
