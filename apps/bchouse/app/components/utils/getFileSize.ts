export async function getFileSize(file: File | Blob) {
  return new Promise<{ height: number; width: number }>((res) => {
    if (file) {
      const reader = new FileReader()

      reader.onload = function (e) {
        const image = new Image()
        image.src = e.target?.result as string

        image.onload = function () {
          const image = this as HTMLImageElement
          const imageWidth = image.width
          const imageHeight = image.height

          return res({ height: imageHeight, width: imageWidth })
        }
      }

      reader.readAsDataURL(file)
    }
  })
}
