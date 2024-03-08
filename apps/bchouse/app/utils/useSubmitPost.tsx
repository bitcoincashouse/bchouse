import { CreatePostParams } from '@bchouse/api/src/types/post'
import { logger } from '@bchouse/utils'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { JSONContent } from '@tiptap/core'
import { AudienceType } from '~/components/post/audience-dropdown'
import { serializeForServer } from '~/components/post/tiptap-extensions'
import { Monetization } from '~/components/post/types'
import { uploadPostMedia } from '~/components/utils/uploadPostMedia'

export type SubmitPostInput = {
  body: JSONContent
  galleryImageUrls: string[]
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
}

export function useSubmitPost(
  options?:
    | {
        onSubmitted?: () => void | Promise<void>
      }
    | undefined
) {
  const queryClient = useQueryClient()
  return useMutation<string, unknown, SubmitPostInput>({
    mutationFn: async ({ body, galleryImageUrls, options }) => {
      try {
        if (!body?.content?.length && !galleryImageUrls.length) {
          throw new Error('Content or media is required to make a post')
        }

        //Media nodes are top level nodes
        let postImageUrls: string[] = []
        if (body.content) {
          postImageUrls = body.content
            .filter((node) => node.type === 'media')
            .map((node) => node.attrs?.src as string)
        }

        const { postImages, galleryImages } = await uploadPostMedia(
          postImageUrls,
          galleryImageUrls
        ).catch((err) => {
          logger.error('Error uploading media: ', err)
          throw new Error('Error uploading media')
        })

        //Add placeholders in content for simpler verification server side
        const contentJson = serializeForServer(body, postImages)
        const galleryIds = galleryImages.map(({ id }) => id).join(',')

        const createPostParams: CreatePostParams =
          'parentPost' in options
            ? {
                mediaIds: galleryIds,
                comment: contentJson,
                parentPost: options.parentPost,
              }
            : {
                mediaIds: galleryIds,
                comment: contentJson,
                audienceType: options.audienceType,
                ...(options.monetization && {
                  monetization: options.monetization,
                }),
              }

        const result = await window.trpcClient.post.post.mutate(
          createPostParams
        )
        if (typeof result === 'string') {
          return result
        } else {
          throw result.error
        }
      } catch (err) {
        logger.error('Error submitting post: ', err)
        throw new Error('Error submitting post')
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feed'] })
      queryClient.invalidateQueries({ queryKey: ['thread'] })
      options?.onSubmitted?.()
    },
  })
}
