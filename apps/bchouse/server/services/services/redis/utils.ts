export function getNResults<T>(
  arr1: Array<T>,
  arr2: Array<T>,
  N: number,
  startFromIndex: number = 0
) {
  const result: Array<T> = []
  startFromIndex = startFromIndex === -1 ? 0 : startFromIndex
  let i = startFromIndex
  let j = 0

  while (i < arr1.length && j < N) {
    result.push(arr1[i] as T)
    i++
    j++
  }

  while (j < N && i - startFromIndex < arr2.length) {
    result.push(arr2[i - startFromIndex] as T)
    i++
    j++
  }

  return result
}
