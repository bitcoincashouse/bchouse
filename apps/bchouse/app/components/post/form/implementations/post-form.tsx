import { useWalletConnect } from '@bchouse/cashconnect'
import { Link, useLocation } from '@remix-run/react'
import { useQueryClient } from '@tanstack/react-query'
import { EditorContent, useEditor } from '@tiptap/react'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { ErrorBoundary } from 'react-error-boundary'
import { $path } from 'remix-routes'
import { Avatar } from '~/components/avatar'
import { classNames } from '~/utils/classNames'
import { useSubmitPost } from '~/utils/useSubmitPost'
import { SetupFundraiserModal } from '../../../fundraiser-modals/setup-fundraiser-modal'
import { Monetization } from '../../types'
import { PostType, PostTypeDropdown } from '../post-type'
import { useFileActions } from '../useFileActions'
// import { EmojiPickerButton } from './emoji-picker-button'
import { z } from 'zod'
import { useCurrentUser } from '~/components/context/current-user-context'
import { ClientOnly } from '../../../client-only'
import Iframely from '../../../iframely'
import { useClientTheme } from '../../../theme-provider'
import { getFileSize } from '../../../utils/getFileSize'
import { MediaInput as FileGrid } from '../media-input'
import { PostActions } from '../post-actions'
import { getExtensions } from '../tiptap-extensions'

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

type PostFormProps = {
  placeholder?: string
  formClassName?: string
  heading?: React.ReactNode
  parentPost?: {
    id: string
    publishedById: string
  }
  showAudience?: boolean
}

type UserMentionData = {
  id: string
  display: string
  username: string
  fullName: string
  avatarUrl: string
  createdAt: string
  bchAddress: string
}

export { ClientOnlyPostForm as PostForm }

const ClientOnlyPostForm: React.FC<PostFormProps> = (props) => {
  return <ClientOnly>{() => <PostForm {...props} />}</ClientOnly>
}

const PostForm: React.FC<PostFormProps> = ({
  placeholder = 'Post a reply!',
  formClassName = '',
  heading = null,
  parentPost,
  showAudience = false,
}) => {
  const currentUser = useCurrentUser()
  const location = useLocation()
  const [hasContent, setHasContent] = React.useState(false)
  const [title, setTitle] = React.useState('')
  const [visited, setVisited] = React.useReducer(() => true, false)
  const { files, removeFile, addFile, replaceFile, clearFiles } =
    useFileActions()
  const formRef = useRef<HTMLFormElement>(null)
  const queryClient = useQueryClient()
  const [postType, setPostType] = useState<PostType>('post')
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
      galleryImageUrls: files.map((f) => f.url),
      options: parentPost
        ? {
            parentPost,
          }
        : {
            audienceType: 'everyone',
            monetization,
          },
    })

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
      setTimeout(() => doSubmit(), 500)
    }
  }

  useEffect(() => {
    if (files) {
      setVisited()
    }
  }, [files])

  const isSubmitting = submissionState === 'pending'
  const isDoneSubmitting = submissionState === 'success'
  const [embeds, setEmbeds] = useState<string[]>([])
  const [embedUrl, setEmbed] = useState<string | null>(null)
  const [theme] = useClientTheme()

  const editor = useEditor(
    {
      extensions: getExtensions(placeholder, removeFile),
      onUpdate: async ({ editor }) => {
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
    },
    []
  )

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
          gcTime: 1000 * 60,
          staleTime: 1000 * 60 * 5,
        })

        if (result) {
          embed = url
        }
      }

      setEmbed(embed)
    })()
  }, [embeds])

  const clearPostForm = () => {
    formRef.current?.reset()
    editor?.commands.clearContent()
    queryClient.invalidateQueries({ queryKey: ['feed'] })

    setTitle('')
    clearFiles()
    setEmbeds([])
    setEmbed(null)
  }

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

  if (currentUser.isAnonymous) {
    return null
  }

  return (
    <div className="flex space-x-3">
      <div className={classNames('flex-shrink-0', visited && 'pt-2')}>
        <Link
          to={$path('/profile/:username', { username: currentUser.username })}
        >
          <Avatar
            className="h-10 w-10 rounded-full"
            src={currentUser.avatarUrl}
            alt=""
          />
        </Link>
      </div>
      <div className="flex flex-col gap-3 min-w-0 flex-1">
        {!!visited && heading}
        <form
          ref={formRef}
          method="POST"
          onSubmit={onSubmit}
          className={classNames(
            formClassName,
            visited ? 'flex-col' : 'flex-row',
            'flex gap-3'
          )}
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
          {visited && showAudience && (
            <div>
              <PostTypeDropdown onChange={setPostType} postType={postType} />
            </div>
          )}
          <div className="grow">
            <label htmlFor="comment" className="sr-only">
              Post Content
            </label>
            {postType === 'campaign' ? (
              <>
                <label htmlFor="comment" className="sr-only">
                  Title
                </label>
                <div className="pb-4">
                  <input
                    type="text"
                    placeholder="Title"
                    className="flex font-semibold !outline-none !ring-0 py-1 text-xl border-0 leading-6 p-0 w-full shadow-none z-[1] relative placeholder:text-[#adb5bd] bg-transparent"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  ></input>
                </div>
              </>
            ) : null}
            <div className="relative flex flex-col gap-2">
              <ErrorBoundary
                fallbackRender={(props) => {
                  props.resetErrorBoundary()
                  return <></>
                }}
              >
                <div>
                  <EditorContent
                    id="comment"
                    key={location.key}
                    placeholder={
                      postType === 'campaign'
                        ? 'Write your proposition here'
                        : placeholder
                    }
                    onFocus={setVisited}
                    onClick={setVisited}
                    className={classNames(
                      'break-word flex text-xl border-0 leading-6 p-0 w-full ring-0 shadow-none outline-none z-[1] relative [&_.ProseMirror]:grow'
                    )}
                    editor={editor}
                  />
                </div>
              </ErrorBoundary>
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
              <PostActions
                editor={editor}
                addFile={addFile}
                disableMedia={files.length >= 4}
                footer={
                  <button
                    type="submit"
                    disabled={isSubmitting || (!hasContent && !files.length)}
                    className={classNames(
                      !hasContent && !files.length ? 'opacity-50' : '',
                      'ml-auto inline-flex items-center justify-center rounded-full border border-transparent bg-primary-btn-400 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-primary-btn-600 focus:outline-none focus:ring-2 focus:ring-primary-btn-500 focus:ring-offset-2'
                    )}
                  >
                    {isSubmitting ? 'Posting...' : 'Submit'}
                  </button>
                }
              />
            </div>
          </div>
        </form>
        {postErrorMessage ? (
          <div className="text-red-600 p-2">{postErrorMessage}</div>
        ) : null}
      </div>
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
    </div>
  )
}
