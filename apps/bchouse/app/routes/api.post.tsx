import { ActionArgs } from '@remix-run/node'
import { FetcherWithComponents } from '@remix-run/react'
import { useQueryClient } from '@tanstack/react-query'
import { JSONContent } from '@tiptap/core'
import { isValidAddress } from 'bchaddrjs'
import { serialize } from 'object-to-formdata'
import { useEffect, useState } from 'react'
import { $path } from 'remix-routes'
import { typedjson, useTypedFetcher } from 'remix-typedjson'
import { z } from 'zod'
import { AudienceType } from '~/components/post/audience-dropdown'
import { serializeForServer } from '~/components/post/tiptap-extensions'
import { Monetization } from '~/components/post/types'
import { isFetcherDone } from '~/components/utils/isFetcherDone'
import { MediaUploadResponse } from '~/routes/api.media.upload.$type.($count)'
import { docSchema } from '~/server/utils/tiptapSchema'
import { logger } from '~/utils/logger'
import moment from '~/utils/moment'

export type CreateTopLevelPostParams = z.input<typeof topLevelPost>
export type CreateChildPostParams = z.input<typeof childPost>
export type CreatePostParams = CreateTopLevelPostParams | CreateChildPostParams

const commentSchema = z
  .string()
  .transform((val) => JSON.parse(val))
  .pipe(docSchema)

const topLevelPost = z.object({
  comment: commentSchema,
  mediaIds: z
    .string()
    .optional()
    .transform((value) => value?.split(',').filter(Boolean) || []),
  audienceType: z
    .enum(['circle', 'everyone'])
    .transform((s) =>
      s === 'everyone' ? ('PUBLIC' as const) : ('CIRCLE' as const)
    ),
  monetization: z
    .object({
      payoutAddress: z.string().refine((val) => isValidAddress(val)),
      network: z.enum([
        'mainnet',
        'chipnet',
        'testnet3',
        'testnet4',
        'regtest',
      ]),
      amount: z.coerce.number().transform((val) => BigInt(val)),
      expires: z.coerce.number().transform((val) => moment.unix(val).toDate()),
      title: z.string().min(3, 'Title too short'),
    })
    .optional(),
})

const childPost = z.object({
  comment: commentSchema,
  mediaIds: z
    .string()
    .optional()
    .transform((value) => value?.split(',').filter(Boolean) || []),
  //Non-top level post
  parentPost: z.object({
    id: z.string().nonempty(),
    publishedById: z.string().nonempty(),
  }),
})

export const action = async (_: ActionArgs) => {
  try {
    await _.context.ratelimit.limitByIp(_, 'api', true)

    const { userId } = await _.context.authService.getAuth(_)
    const formData = await _.request.json()

    const form = topLevelPost.or(childPost).parse(formData)

    const newPostId = await _.context.postService.addPost(
      userId,
      'parentPost' in form
        ? {
            content: form.comment,
            audienceType: 'CHILD' as const,
            mediaIds: form.mediaIds,
            parentPost: {
              id: form.parentPost.id,
              publishedById: form.parentPost.publishedById,
            },
          }
        : {
            content: form.comment,
            audienceType: form.audienceType,
            mediaIds: form.mediaIds,
            monetization: form.monetization,
          }
    )

    return typedjson(newPostId)
  } catch (err) {
    logger.error(err)

    return typedjson({
      error: {
        message: 'Error submitting post. Please try again.',
      },
    })
  }
}

export function useSubmitPost(
  options?:
    | {
        onSubmitted?: () => void | Promise<void>
      }
    | undefined
) {
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
      if (!body?.content?.length) return

      //Media nodes are top level nodes
      const postImageUrls = body.content
        .filter((node) => node.type === 'media')
        .map((node) => node.attrs?.src as string)

      const { postImages, galleryImages } = await uploadImages(
        postImageUrls,
        galleryImageUrls
      )

      //Add placeholders in content for simpler verification server side
      const contentJson = serializeForServer(body, postImages)
      const galleryIds = galleryImages.map(({ id }) => id).join(',')
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
