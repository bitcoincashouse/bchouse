import { uploadCoverPhoto } from './uploadCoverPhoto'

export type EditUserFields = {
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

export async function saveProfile(data: EditUserFields) {
  let coverPhotoMediaId

  if (data.coverPhotoFile) {
    coverPhotoMediaId = await uploadCoverPhoto(data.coverPhotoFile)
  }

  if (data.avatarFile) {
    await window.clerk.user?.setProfileImage({
      file: data.avatarFile,
    })
  }

  await window.clerk.user?.update({
    firstName: data.firstName || '',
    lastName: data.lastName || '',
  })

  await window.trpcClient.profile.updateProfile.mutate({
    about: data.about,
    bchAddress: data.bchAddress,
    company: data.company,
    title: data.title,
    website: data.website,
    coverPhotoMediaId,
  })
}
