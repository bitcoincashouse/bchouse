import { z } from 'zod'
import { Cursor } from '../repositories/types'

export function serializeCursor(cursor: Cursor | undefined) {
  return cursor
    ? Buffer.from(JSON.stringify(cursor)).toString('base64')
    : undefined
}

export function deserializeCursor(
  cursor: string | undefined
): Cursor | undefined {
  if (!cursor) return undefined
  const decoded = Buffer.from(cursor, 'base64').toString()

  return z
    .object({
      fromTimestamp: z.coerce.date(),
      fromId: z.string(),
    })
    .parse(JSON.parse(decoded))
}
