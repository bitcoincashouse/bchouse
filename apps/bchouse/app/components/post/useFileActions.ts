import { useState } from 'react'

export type Media = {
  url: string
  height: number
  width: number
}

export function useFileActions(initialFiles?: Media[]) {
  const [files, setFiles] = useState<Media[]>(initialFiles || [])

  const clearFiles = () => {
    setFiles([])
  }

  const removeFile = (fileUrl: string) => {
    setFiles((files) => files.filter((media) => media.url !== fileUrl))
  }

  const addFile = (
    file: File | Blob | string | undefined,
    height: number,
    width: number
  ) => {
    if (file) {
      const url = typeof file === 'string' ? file : URL.createObjectURL(file)
      return setFiles((files) => {
        if (files.length >= 4) return files.slice(0, 4)
        return [...files, { url, height, width }]
      })
    }
  }

  const replaceFile = (
    oldUrl: string,
    newFile: string | Blob,
    height: number,
    width: number
  ) => {
    const fileIndex = files.findIndex((media) => media.url === oldUrl)
    const oldFile = files[fileIndex]

    //Return same or +1?
    if (oldFile) {
      const url =
        typeof newFile === 'string' ? newFile : URL.createObjectURL(newFile)
      setFiles((files) => [
        ...files.slice(0, fileIndex),
        { url, height, width },
        ...files.slice(fileIndex + 1),
      ])
    }
  }

  return { files, removeFile, addFile, replaceFile, clearFiles }
}
