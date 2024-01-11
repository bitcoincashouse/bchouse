import { db } from '~/server/db'

export async function getUserExists(params: { userId: string }) {
  return await db
    .selectFrom('User')
    .where('User.id', '=', params.userId)
    .select('id')
    .executeTakeFirst()
    .then((row) => !!row?.id)
}

export async function valiateUser(params: {
  userId: string
  username: string
}) {
  return await db
    .selectFrom('User')
    .where((eb) =>
      eb.eb('id', '=', params.userId).and('username', '=', params.username)
    )
    .select('id')
    .executeTakeFirst()
    .then((row) => !!row?.id)
}
