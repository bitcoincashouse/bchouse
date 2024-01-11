export type Cursor = {
  fromTimestamp: Date
  fromId: string
}

export type PaginationCursorStyle =
  | 'FIRST_OF_NEXT_PAGE'
  | 'LAST_OF_CURRENT_PAGE'
