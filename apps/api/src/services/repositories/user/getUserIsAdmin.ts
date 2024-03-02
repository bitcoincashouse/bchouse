import { db } from '~/services/db'

export async function getUserIsAdmin(params: {
  userId: string
}): Promise<boolean> {
  const { userId } = params
  return await db
    .selectFrom('User')
    .where('id', '=', userId)
    .select('__isAdmin as isAdmin')
    .executeTakeFirstOrThrow()
    .then((row) => !!row.isAdmin)
}
