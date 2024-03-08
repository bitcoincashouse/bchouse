import { useWalletConnect } from '@bchouse/cashconnect'
import { Link, useLocation } from '@remix-run/react'
import { useQueryClient } from '@tanstack/react-query'
import { EditorContent, useEditor } from '@tiptap/react'
import React, { useEffect, useRef, useState } from 'react'
import { $path } from 'remix-routes'
import { z } from 'zod'
import { Avatar } from '~/components/avatar'
import { classNames } from '~/utils/classNames'
import { useSubmitPost } from '~/utils/useSubmitPost'
import { SetupFundraiserModal } from '../fundraiser-modals/setup-fundraiser-modal'
import { Modal } from '../modal'
import { getFileSize } from '../utils/getFileSize'
import { Input as FileGrid } from './file-grid'
import Iframely from './iframely'
import { PostActions } from './post-actions'
import { PostContentRenderer } from './post-content-renderer'
import { PostType, PostTypeDropdown } from './post-type'
import { getExtensions } from './tiptap-extensions'
import { Monetization, Post } from './types'
import { useFileActions } from './useFileActions'

const KEY = '8fb648a43d7cabada3cae0e30ac0322b'

function fetchEmbed(url: string) {
  return fetch(
    `https://cdn.iframe.ly/api/iframely?url=${encodeURIComponent(
      url
    )}&key=${KEY}`
  )
    .then((res) => res.json())
    .then((res) => {
      const result = z
        .object({
          html: z.string(),
        })
        .or(
          z.object({
            error: z.number(),
            message: z.string(),
          })
        )
        .safeParse(res)

      if (!result.success) {
        throw {
          code: 500,
          message: 'Failed to parse error',
        }
      } else if ('error' in result.data) {
        throw {
          code: result.data.error,
          message: result.data.message,
        }
      } else {
        return { __html: result.data.html }
      }
    })
    .catch(() => null)
}

export const PostModal: React.FC<{
  user: {
    avatarUrl: string | undefined
  }
  isOpen: boolean
  onClose: () => void
  parentPost: Post | null
}> = ({ isOpen, onClose, user, parentPost }) => {
  const location = useLocation()
  const [hasContent, setHasContent] = React.useState(false)
  const [title, setTitle] = React.useState('')
  const [postType, setPostType] = useState<PostType>('post')
  const formRef = useRef<HTMLFormElement>(null)
  const queryClient = useQueryClient()
  const [embeds, setEmbeds] = useState<string[]>([])
  const [embedUrl, setEmbed] = useState<string | null>(null)

  const { files, removeFile, addFile, replaceFile, clearFiles } =
    useFileActions()

  const editor = useEditor(
    {
      extensions: getExtensions?.("What's building?", removeFile),
      onUpdate: ({ editor }) => {
        setHasContent(editor.getText().trim().length > 0)
        let links: string[] = []

        editor.state.doc.descendants((node, pos, parent) => {
          const linkMark = node.marks.find((mark) => mark.type?.name === 'link')

          if (linkMark) {
            links.push(linkMark.attrs.href)
            return false // Stop traversal
          }

          return true
        })

        setEmbeds(links)
      },
      onCreate: ({ editor }) => {
        setTimeout(() => {
          editor.commands.focus()
        }, 200)
      },
    },
    []
  )

  const {
    mutate: submitPost,
    data: newPostId,
    status: submissionState,
    error: postError,
  } = useSubmitPost()

  const { setReferenceElement, close: closeWalletConnect } = useWalletConnect()
  const [openWalletConnect, setOpenWalletConnect] = useState(false)

  const doSubmit = (monetization?: Monetization) =>
    editor &&
    submitPost({
      body: editor.getJSON(),
      galleryImageUrls: files.map((file) => file.url),
      options: parentPost
        ? {
            parentPost: {
              id: parentPost.id,
              publishedById: parentPost.publishedById,
            },
          }
        : {
            audienceType: 'everyone',
            monetization,
          },
    })

  useEffect(() => {
    ;(async () => {
      let embed: string | null = null
      for (let i = 0; i < embeds.length; i++) {
        const url = embeds[i] as string

        const result = await queryClient.fetchQuery({
          queryKey: ['check-embed', url],
          queryFn: () => {
            return fetchEmbed(url)
          },
          cacheTime: 1000 * 60,
          staleTime: 1000 * 60 * 5,
        })

        if (result) {
          embed = url
          break
        }
      }

      setEmbed(embed)
    })()
  }, [embeds])

  const onSubmit: React.FormEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault()

    if (postType === 'campaign') {
      if (
        document.activeElement &&
        document.activeElement instanceof HTMLElement
      ) {
        document.activeElement.blur()
      }

      setOpenWalletConnect(true)
    } else {
      doSubmit()
    }
  }

  const clearPostForm = () => {
    formRef.current?.reset()
    editor?.commands.clearContent()
    queryClient.invalidateQueries({ queryKey: ['feed'] })

    setTitle('')
    clearFiles()
    setEmbed(null)
    onClose()
  }

  const isSubmitting = submissionState === 'pending'
  const isDoneSubmitting = submissionState === 'success'

  useEffect(() => {
    if (isDoneSubmitting && !postError) {
      clearPostForm()
    }
  }, [isDoneSubmitting])

  const postErrorMessage = useMemo(() => {
    if (typeof postError !== 'object' || postError == null) {
      return
    }

    return 'message' in postError && typeof postError.message === 'string'
      ? postError.message
      : 'Sorry, something went wrong publishing your post.'
  }, [postError])

  return (
    <>
      <Modal open={isOpen} onClose={onClose} size={'small'}>
        <form
          ref={formRef}
          method="POST"
          action={$path('/api/post')}
          onSubmit={onSubmit}
          preventScrollReset={true}
          onPaste={async (ev) => {
            const items = ev.clipboardData.items

            for (let i = 0; i < items.length; i++) {
              const item = items[i]

              if (item && item?.type.indexOf('image') !== -1) {
                const blob = item.getAsFile()
                if (blob) {
                  const { height, width } = await getFileSize(blob)
                  addFile(blob, height, width)
                }
              }
            }
          }}
          onDrop={async (ev) => {
            const files: Array<File | Blob> = []
            const dataURL = ev.dataTransfer.getData('text/uri-list')
            if (dataURL && dataURL.startsWith('data:image/')) {
              const fileType = dataURL.split(':')[1]?.split(';')[0]
              files.push(new Blob([dataURL], { type: fileType }))
            } else if (z.string().url().safeParse(dataURL).success) {
              await fetch(dataURL, { method: 'HEAD' }) // Use 'HEAD' method to fetch only the headers
                .then(async (response) => {
                  if (response.ok) {
                    const contentType = response.headers.get('content-type')
                    if (contentType && contentType.startsWith('image/')) {
                      const image = await (await fetch(dataURL)).blob()
                      files.push(image)
                    }
                  }

                  return
                })
                .catch((err) => {
                  console.log(err)
                })
            }

            for (const file of ev.dataTransfer.files) {
              if (file.type.startsWith('image/')) {
                files.push(file)
              }
            }

            files.map(async (file) => {
              const { height, width } = await getFileSize(file)
              addFile(file, height, width)
            })

            ev.preventDefault()
          }}
        >
          <div>
            {parentPost ? (
              <div className={classNames('relative pt-8 pb-4 px-4')}>
                <div className="relative">
                  <span
                    className="absolute top-5 left-5 -ml-px h-full w-0.5 bg-gray-200"
                    aria-hidden="true"
                  />
                  <div className="relative flex items-start space-x-3">
                    <>
                      <div className="relative mr-2">
                        <Avatar
                          className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-400"
                          src={parentPost.avatarUrl}
                          alt=""
                        />
                      </div>
                      <div className="min-w-0 flex-1 relative">
                        <div>
                          <div className="text-base">
                            <Link
                              to={$path('/profile/:username', {
                                username: parentPost.person.handle,
                              })}
                              className="font-medium text-primary-text"
                            >
                              {parentPost.person.name}{' '}
                              <span className="text-sm text-secondary-text">
                                {parentPost.date}
                              </span>
                            </Link>
                          </div>
                        </div>
                        <div className="mt-2 text-base text-primary-text break-word">
                          <PostContentRenderer content={parentPost.content} />
                        </div>
                      </div>
                    </>
                  </div>
                </div>
              </div>
            ) : null}
            <div className="relative min-h-[120px] flex items-start p-4 gap-3 font-light">
              <div className="basis-[40px]">
                <Avatar
                  className="flex m-auto h-10 w-10 items-center justify-center rounded-full bg-gray-400"
                  src={user.avatarUrl}
                  alt=""
                />
              </div>
              <div className="min-w-0 flex-1 flex flex-col gap-2">
                {!parentPost ? (
                  <div>
                    <PostTypeDropdown
                      onChange={setPostType}
                      postType={postType}
                    />
                  </div>
                ) : null}
                <div>
                  {postType === 'campaign' ? (
                    <>
                      <label htmlFor="comment" className="sr-only">
                        Title
                      </label>
                      <div className="pb-4">
                        <input
                          type="text"
                          placeholder="Title"
                          className="flex break-word font-semibold !outline-none !ring-0 py-1 text-xl border-0 leading-6 p-0 w-full shadow-none z-[1] relative placeholder:text-[#adb5bd] bg-transparent"
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          required
                        ></input>
                      </div>
                    </>
                  ) : null}
                  <label htmlFor="comment" className="sr-only">
                    Post Content
                  </label>
                  <EditorContent
                    id="comment"
                    name="comment"
                    rows={3}
                    editor={editor}
                    className="break-word pb-4 text-xl h-auto px-0 block w-full rounded-md border-transparent focus:border-transparent focus:ring-0"
                    placeholder={
                      postType === 'campaign'
                        ? 'Write your proposition here'
                        : "What's building?"
                    }
                    onKeyDown={(event) => {
                      if (event.key === 'Escape') {
                        if (editor?.isFocused) {
                          editor.commands.blur()
                        } else {
                          clearPostForm()
                        }
                      }
                    }}
                  />
                </div>
                {files.length ? (
                  <FileGrid
                    files={files}
                    onRemove={(file: string) => removeFile(file)}
                    onCrop={(url, newFile, height, width) =>
                      replaceFile(url, newFile, height, width)
                    }
                  />
                ) : embedUrl ? (
                  <Iframely url={embedUrl} allowFullHeight />
                ) : null}
              </div>
            </div>
          </div>
          <PostActions
            className="flex justify-between items-end gap-3 p-4 border-t border-gray-200 dark:border-gray-700"
            editor={editor}
            disableMedia={files.length >= 4}
            addFile={addFile}
            footer={
              <button
                type="submit"
                disabled={isSubmitting || !hasContent}
                className={classNames(
                  !hasContent ? 'opacity-50' : '',
                  'ml-auto inline-flex items-center justify-center rounded-full border border-transparent bg-primary-btn-400 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-primary-btn-600 focus:outline-none focus:ring-2 focus:ring-primary-btn-500 focus:ring-offset-2'
                )}
              >
                {isSubmitting ? 'Posting...' : 'Submit'}
              </button>
            }
          />
        </form>
        {postErrorMessage ? (
          <div className="text-red-600 p-2">{postErrorMessage}</div>
        ) : null}
      </Modal>
      {openWalletConnect ? (
        <SetupFundraiserModal
          ref={(ref) => {
            setReferenceElement(ref)
          }}
          onClose={async (monetization) => {
            await closeWalletConnect()
            setOpenWalletConnect(false)

            if (monetization) {
              doSubmit({
                ...monetization,
                title,
              })
            }
          }}
        />
      ) : null}
    </>
  )
}
