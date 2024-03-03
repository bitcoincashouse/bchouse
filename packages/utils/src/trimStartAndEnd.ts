export function trimStartAndEnd<T>(
  items: T[],
  predicate: (item: T) => boolean
) {
  const startSlice = items.findIndex(predicate)

  //If no matches found, return empty
  if (startSlice === -1) return []

  const endSlice = items.slice(startSlice).reverse().findIndex(predicate)

  //If no matches found after startSlice, return just startSlice, otherwise return up to endSlice
  return endSlice === -1
    ? items.slice(startSlice, startSlice + 1)
    : items.slice(startSlice, items.length - endSlice)
}
