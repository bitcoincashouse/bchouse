export function pluralize({
  singular,
  plural,
  count,
  showCount,
  zero,
}: {
  singular: string
  plural?: string
  count: number
  showCount?: boolean
  zero?: string
}) {
  if (count === 0 && zero) return zero

  let output = singular
  if (count !== 1) {
    output = plural || `${singular}s`
  }

  return showCount ? `${count} ${output}` : output
}
