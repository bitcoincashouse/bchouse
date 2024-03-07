import { logger } from '@bchouse/utils'
import { useClerk } from '@clerk/remix'
import { ErrorMessage } from '@hookform/error-message'
import { isValidAddress } from 'bchaddrjs'
import { serialize } from 'object-to-formdata'
import { forwardRef, useEffect, useMemo } from 'react'
import {
  Controller,
  ControllerRenderProps,
  SubmitHandler,
  useForm,
} from 'react-hook-form'
import { $path } from 'remix-routes'
import { UseDataFunctionReturn, useTypedFetcher } from 'remix-typedjson'
import { Avatar } from '~/components/avatar'
import { action as mediaUploadLoader } from '~/routes/api.media.upload.$type.($count)'
import { action as updateProfileLoader } from '~/routes/api.profile.($userId)'
import { ImageProxy } from './image-proxy'
import { Modal } from './modal'
import { classnames } from './utils/classnames'

type EditUserFields = {
  id: string
  username: string
  firstName: string | undefined | null
  lastName: string | undefined | null
  coverPhotoUrl: string | undefined | null
  about: string | undefined | null
  website: string | undefined | null
  title: string | undefined | null
  company: string | undefined | null
  bchAddress: string | undefined | null
  avatarFile?: File | undefined
  coverPhotoFile?: File | undefined
}

export function EditProfileModal({
  open,
  closeModal,
  user,
}: {
  user: {
    id: string
    username: string
    firstName: string | undefined | null
    lastName: string | undefined | null
    coverPhotoUrl: string | undefined | null
    avatarUrl: string | undefined | null
    about: string | undefined | null
    website: string | undefined | null
    title: string | undefined | null
    company: string | undefined | null
    bchAddress: string | undefined | null
  }
  open: boolean
  closeModal: () => void
}) {
  const fetcher = useTypedFetcher<typeof updateProfileLoader>()
  const clerk = useClerk()

  const saveProfile: SubmitHandler<
    EditUserFields & {
      avatarFile?: File
      coverPhotoFile?: File
    }
  > = async ({ coverPhotoFile, avatarFile, firstName, lastName }, e) => {
    if (!e) return
    const formData = new FormData(e.target)

    if (coverPhotoFile) {
      const errors: Error[] = []

      //TODO: trpc.uploadMedia
      const results = (await (
        await fetch(
          $path('/api/media/upload/:type/:count?', {
            type: 'coverPhoto',
            count: 1,
          }),
          {
            method: 'POST',
          }
        )
      ).json()) as UseDataFunctionReturn<typeof mediaUploadLoader>

      await Promise.all(
        results.map(async ({ form, type, key }) => {
          let uploadRequestForm = serialize(form.fields)

          uploadRequestForm.append('file', coverPhotoFile!)
          formData.append('coverPhotoMediaId', key)

          const response = await fetch(form.url, {
            method: 'POST',
            body: uploadRequestForm,
          }).catch((e) => ({ ok: false as const, statusText: e.message }))

          if (!response.ok) {
            errors.push(new Error(response.statusText))
            return
          }
        })
      )

      if (errors.length) {
        logger.error(errors)
        throw new Error('Error uploading files')
      }
    }

    if (avatarFile) {
      await clerk.user?.setProfileImage({
        file: avatarFile,
      })
    }

    await clerk.user?.update({
      firstName: firstName || '',
      lastName: lastName || '',
    })

    //TODO: trpc.updateProfile
    fetcher.submit(formData, {
      method: 'POST',
      action: $path('/api/profile/:userId?', {
        userId: user.id,
      }),
      preventScrollReset: true,
    })
  }

  const defaults = useMemo(() => {
    return {
      ...user,
      coverPhotoFile: undefined,
      avatarFile: undefined,
    } as EditUserFields
  }, [user])

  const {
    control,
    register,
    handleSubmit,
    setFocus,
    formState: { errors },
    setError,
    watch,
  } = useForm({
    mode: 'onBlur',
    reValidateMode: 'onChange',
    defaultValues: defaults,
  })

  useEffect(() => {
    const isDone = fetcher.state !== 'idle' && fetcher.data != null
    const isError =
      typeof fetcher.data !== 'undefined' && 'error' in fetcher.data

    if (!isDone) return

    if (!isError) {
      closeModal()
    } else {
      setError('root.serverCatch', {
        type: 'server',
        message: 'An error occurred saving your profile',
      })
    }
  }, [fetcher.data])

  useEffect(() => {
    setFocus('firstName')
  }, [setFocus])

  const aboutLength = watch('about')?.length || 0

  return (
    <Modal open={open} onClose={closeModal} title="Edit Profile">
      <fetcher.Form
        method="POST"
        onSubmit={handleSubmit(saveProfile)}
        preventScrollReset={true}
      >
        <div>
          <div className="bg-primary">
            <Controller
              render={({ field }) => (
                <CoverPhotoPicker
                  defaultPreview={user.coverPhotoUrl}
                  {...field}
                />
              )}
              name="coverPhotoFile"
              control={control}
            />
          </div>
          <div className="bg-primary pt-2 lg:px-8 max-w-5xl mx-auto px-4 sm:px-6">
            <Controller
              render={({ field }) => (
                <AvatarPicker defaultPreview={user.avatarUrl} {...field} />
              )}
              name="avatarFile"
              control={control}
            />
          </div>
          <div className="px-4 sm:px-8 pb-4 pt-4">
            <div className="lg:col-span-9">
              {/* Profile section */}
              <div className="flex flex-col gap-6">
                <div className="flex flex-col flex-grow gap-y-6">
                  {/* First/Last Name */}
                  <div className="grid grid-cols-12 gap-4">
                    <div className="col-span-12 xs:col-span-6">
                      <label
                        htmlFor="firstName"
                        className="block text-sm font-medium text-primary-text"
                      >
                        First name
                      </label>
                      <input
                        type="text"
                        id="firstName"
                        autoComplete="given-name"
                        className="mt-1 block w-full rounded-md bg-hover bg-opacity-25 border border-gray-300 dark:border-gray-800 py-2 px-3 focus:border-sky-500 focus:outline-none focus:ring-sky-500 sm:text-sm"
                        {...register('firstName')}
                      />
                    </div>
                    <div className="col-span-12 xs:col-span-6">
                      <label
                        htmlFor="lastName"
                        className="block text-sm font-medium text-primary-text"
                      >
                        Last name
                      </label>
                      <input
                        type="text"
                        id="lastName"
                        autoComplete="family-name"
                        className="mt-1 block w-full rounded-md bg-hover bg-opacity-25 border border-gray-300 dark:border-gray-800 py-2 px-3 focus:border-sky-500 focus:outline-none focus:ring-sky-500 sm:text-sm"
                        {...register('lastName')}
                      />
                    </div>
                  </div>
                </div>
                {/* Bitcoin Cash */}
                <div className="grid grid-cols-12 gap-4">
                  <div className="col-span-12">
                    <label
                      htmlFor="bchAddress"
                      className="block text-sm font-medium text-primary-text"
                    >
                      Bitcoin Cash Address
                    </label>
                    <input
                      type="text"
                      id="bchAddress"
                      autoComplete="bchAddress"
                      className="text-sm sm:text-base mt-1 block w-full rounded-md bg-hover bg-opacity-25 border border-solid border-gray-300 dark:border-gray-800 focus:border-sky-500 focus:ring-sky-500"
                      {...register('bchAddress', {
                        validate: (val) =>
                          !val || isValidAddress(val) || 'Invalid BCH address',
                      })}
                    />
                    <ErrorMessage
                      errors={errors}
                      name="bchAddress"
                      render={({ message }) => (
                        <p className="text-red-500">{message}</p>
                      )}
                    />
                  </div>
                </div>

                {/* About */}
                <div className="grid grid-cols-12 gap-4">
                  <div className="col-span-12">
                    <label
                      htmlFor="about"
                      autoFocus
                      className="flex flex-row gap-2 items-baseline text-sm font-medium text-primary-text"
                    >
                      <span>About </span>
                      <p className="text-xs text-secondary-text">
                        {' (Brief description for your profile)'}
                      </p>
                    </label>
                    <div className="mt-1">
                      <textarea
                        id="about"
                        rows={3}
                        className="text-sm sm:text-base mt-1 block w-full rounded-md bg-hover bg-opacity-25 border border-solid border-gray-300 dark:border-gray-800 focus:border-sky-500 focus:ring-sky-500"
                        {...register('about', {
                          maxLength: {
                            value: 180,
                            message:
                              'About must be less than 180 characters long',
                          },
                        })}
                      />
                      <p className="flex flex-row justify-between items-center pt-1">
                        <ErrorMessage
                          errors={errors}
                          name="about"
                          render={({ message }) => (
                            <span className="text-red-500">{message}</span>
                          )}
                        />
                        <span
                          className={classnames(
                            'text-xs text-secondary-text ml-auto',
                            aboutLength > 180 && 'text-red-500'
                          )}
                        >
                          {aboutLength} / 180
                        </span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Website */}
                <div className="grid grid-cols-12 gap-4">
                  <div className="col-span-12">
                    <label
                      htmlFor="website"
                      className="block text-sm font-medium text-primary-text"
                    >
                      Website
                    </label>
                    <input
                      type="text"
                      id="website"
                      className="text-sm sm:text-base mt-1 block w-full rounded-md bg-hover bg-opacity-25 border border-solid border-gray-300 dark:border-gray-800 py-2 px-3 focus:border-sky-500 focus:outline-none focus:ring-sky-500"
                      {...register('website')}
                    />
                  </div>
                </div>

                {/* Title / Organization */}
                <div className="grid grid-cols-12 gap-4">
                  <div className="col-span-12 sm:col-span-6">
                    <label
                      htmlFor="title"
                      className="block text-sm font-medium text-primary-text"
                    >
                      Title
                    </label>
                    <input
                      type="text"
                      id="title"
                      autoComplete="organization"
                      className="text-sm sm:text-base mt-1 block w-full rounded-md bg-hover bg-opacity-25 border border-solid border-gray-300 dark:border-gray-800 py-2 px-3 focus:border-sky-500 focus:outline-none focus:ring-sky-500"
                      {...register('title')}
                    />
                  </div>

                  <div className="col-span-12 sm:col-span-6">
                    <label
                      htmlFor="company"
                      className="block text-sm font-medium text-primary-text"
                    >
                      Organization
                    </label>
                    <input
                      type="text"
                      id="company"
                      autoComplete="organization"
                      className="text-sm sm:text-base mt-1 block w-full rounded-md bg-hover bg-opacity-25 border border-solid border-gray-300 dark:border-gray-800 py-2 px-3 focus:border-sky-500 focus:outline-none focus:ring-sky-500"
                      {...register('company')}
                    />
                  </div>
                </div>
              </div>

              <div className="pt-3">
                <ErrorMessage
                  errors={errors}
                  name="root.serverCatch"
                  render={({ message }) => (
                    <p className="text-red-500">{message}</p>
                  )}
                />
              </div>

              {/* <PrivacySettings></PrivacySettings> */}
              <div className="!border-t-0 flex justify-end mt-6">
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault()
                    closeModal()
                  }}
                  className="inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-800 bg-primary py-2 px-4 text-sm font-medium text-primary-text shadow-sm hover:bg-hover focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="ml-5 inline-flex justify-center rounded-md border border-transparent bg-sky-700 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-sky-800 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      </fetcher.Form>
    </Modal>
  )
}

const CoverPhotoPicker = forwardRef(
  (props: ControllerRenderProps & { defaultPreview?: string | null }, ref) => {
    const { defaultPreview, onChange, onBlur, value, name } = props

    const coverPhotoPreviewUrl = useMemo(() => {
      if (value instanceof File) {
        return URL.createObjectURL(value)
      }

      return
    }, [value, defaultPreview])

    return (
      <>
        <div className="aspect-[9/3] relative overflow-hidden">
          <div>
            <>
              {coverPhotoPreviewUrl ? (
                <img
                  id={name + '__preview'}
                  className="aspect-[9/3] h-full w-full object-cover"
                  src={coverPhotoPreviewUrl}
                  alt=""
                />
              ) : defaultPreview ? (
                <ImageProxy
                  id={name + '__preview'}
                  className="aspect-[9/3] h-full w-full object-cover"
                  mediaKey={defaultPreview}
                  width={600}
                  quality={100}
                  aspectRatio="9:3"
                  alt=""
                />
              ) : null}
              <label
                className="absolute inset-0 flex h-full w-full items-center justify-center bg-black bg-opacity-75 text-sm font-medium text-white opacity-0 hover:opacity-100"
                htmlFor={'coverPhoto_upload'}
              >
                <span>Change</span>
                <span className="sr-only"> user photo</span>
                <input
                  id={name}
                  type="file"
                  onChange={(e) => onChange(e.currentTarget.files?.[0])}
                  name={name}
                  onBlur={onBlur}
                  className="absolute inset-0 h-full w-full cursor-pointer rounded-md bg-hover bg-opacity-25 border-gray-300 dark:border-gray-800 opacity-0"
                />
              </label>
            </>
          </div>
        </div>
      </>
    )
  }
)

const AvatarPicker = forwardRef(
  (props: ControllerRenderProps & { defaultPreview?: string | null }, ref) => {
    const { defaultPreview, onChange, onBlur, value, name } = props

    const previewAvatar = useMemo(() => {
      if (value instanceof File) {
        return URL.createObjectURL(value)
      }

      return defaultPreview || ''
    }, [value, defaultPreview])

    return (
      <>
        {/* Avatar and edit button */}
        <div className="flex items-start justify-between">
          <div className="-mt-[15%] z-20 w-1/4 max-w-[8rem]">
            <div>
              <div className="flex-grow lg:flex-shrink-0 lg:flex-grow-0">
                <div className="relative overflow-hidden rounded-full block">
                  <label
                    htmlFor={name}
                    className="absolute inset-0 flex h-full w-full items-center justify-center bg-black bg-opacity-75 text-sm font-medium text-white opacity-0 hover:opacity-100"
                  >
                    <span>Change</span>
                    <span className="sr-only"> user photo</span>
                    <input
                      type="file"
                      id={name}
                      className="absolute inset-0 h-full w-full cursor-pointer rounded-md bg-hover bg-opacity-25 border-gray-300 dark:border-gray-800 opacity-0"
                      name={name}
                      onBlur={onBlur}
                      onChange={(e) => onChange(e.currentTarget.files?.[0])}
                    />
                  </label>
                  <Avatar className="w-full" src={previewAvatar} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    )
  }
)
