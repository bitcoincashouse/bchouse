export function filterFalsy<T>(arr: (T|undefined|boolean)[]) {
  return arr.filter(Boolean) as T[]
}