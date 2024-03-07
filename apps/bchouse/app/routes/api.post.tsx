import { CreatePostParams } from '@bchouse/api/src/pages/post'
import { FetcherWithComponents } from '@remix-run/react'
import { useQueryClient } from '@tanstack/react-query'
import { JSONContent } from '@tiptap/core'
import { serialize } from 'object-to-formdata'
import { useEffect, useState } from 'react'
import { $path } from 'remix-routes'
import { useTypedFetcher } from 'remix-typedjson'
import { AudienceType } from '~/components/post/audience-dropdown'
import { serializeForServer } from '~/components/post/tiptap-extensions'
import { Monetization } from '~/components/post/types'
import { isFetcherDone } from '~/components/utils/isFetcherDone'

export function useSubmitPost(
  options?:
    | {
        onSubmitted?: () => void | Promise<void>
      }
    | undefined
) {
  //TODO: trpc.post
  const fetcher = useTypedFetcher<typeof action>()
  const [postError, setPostError] = useState<Error | undefined>(undefined)

  async function submitPost(
    body: JSONContent,
    galleryImageUrls: string[],
    options:
      | {
          parentPost: {
            id: string
            publishedById: string
          }
        }
      | {
          monetization?: Monetization
          audienceType: AudienceType
        }
  ) {
    try {
      setPostError(undefined)
      if (!body?.content?.length && !galleryImageUrls.length) return

      //Media nodes are top level nodes
      let postImageUrls: string[] = []
      if (body.content) {
        postImageUrls = body.content
          .filter((node) => node.type === 'media')
          .map((node) => node.attrs?.src as string)
      }

      const { postImages, galleryImages } = await uploadImages(
        postImageUrls,
        galleryImageUrls
      )

      //Add placeholders in content for simpler verification server side
      const contentJson = serializeForServer(body, postImages)
      const galleryIds = galleryImages.map(({ id }) => id).join(',')

      //TODO: trpc.post
      const createPostParams: CreatePostParams =
        'parentPost' in options
          ? {
              mediaIds: galleryIds,
              comment: JSON.stringify(contentJson) as any,
              parentPost: options.parentPost,
            }
          : {
              mediaIds: galleryIds,
              comment: JSON.stringify(contentJson) as any,
              audienceType: options.audienceType,
              ...(options.monetization && {
                monetization: options.monetization,
              }),
            }

      fetcher.submit(JSON.stringify(createPostParams), {
        method: 'POST',
        encType: 'application/json',
        action: $path('/api/post'),
      })
    } catch (err) {
      setPostError(err as Error)
    }
  }

  const isSubmitting =
    fetcher.state === 'submitting' || fetcher.state === 'loading'
  const isDone = isFetcherDone(fetcher as FetcherWithComponents<any>)

  const queryClient = useQueryClient()

  useEffect(() => {
    if (isDone && !postError) {
      queryClient.invalidateQueries({ queryKey: ['feed'] })
      queryClient.invalidateQueries({ queryKey: ['thread'] })
      options?.onSubmitted?.()
    }
  }, [isDone])

  const loaderError =
    typeof fetcher.data === 'object' && 'error' in fetcher.data
      ? fetcher.data.error
      : undefined

  return {
    submissionState: isSubmitting
      ? ('submitting' as const)
      : isDone
      ? ('done' as const)
      : ('idle' as const),
    postId: typeof fetcher.data === 'string' ? fetcher.data : undefined,
    fetcher,
    submitPost,
    postError: loaderError || postError,
  }
}

async function uploadImages(
  postImageUrls: string[],
  galleryImageUrls: string[]
) {
  //Get media upload presigned post requests
  const totalImageCount = galleryImageUrls.length + postImageUrls.length
  //TODO: trpc.uploadMedia
  const getUploadRequestsUrl = $path('/api/media/upload/:type/:count?', {
    type: 'post',
    count: totalImageCount,
  })

  const results = totalImageCount
    ? ((await (
        await fetch(
          getUploadRequestsUrl +
            '?_data=routes/api.media.upload.$type.($count)',
          { method: 'POST' }
        )
      ).json()) as MediaUploadResponse)
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
