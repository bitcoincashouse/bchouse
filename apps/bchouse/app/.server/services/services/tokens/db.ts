import { db } from '../../db'

export async function updateTokenOwners(
  outputs: Array<{
    currentOwnerAddress: string
    categoryId: string
    commitment: string
  }>
) {
  await db.transaction().execute(async (trx) => {
    await Promise.all(
      outputs.map(({ currentOwnerAddress, categoryId, commitment }) => {
        trx
          .updateTable('TokenTypes as t')
          .where((eb) =>
            eb
              .eb('t.categoryId', '=', categoryId)
              .and('t.commitment', '=', commitment)
          )
          .set({
            currentOwnerAddress,
          })
      })
    )
  })
}

export async function removeToken(id: string) {
  await db
    .updateTable('TokenCategory')
    .set({
      deleted: 1,
    })
    .where('id', '=', id)
    .execute()
}

export async function getLatestHash(categoryId: string) {
  return (
    (await db
      .selectFrom('TokenCategory')
      .select('lastHash')
      .where('categoryId', '=', categoryId)
      .executeTakeFirst()) ?? { lastHash: undefined }
  )
}

export async function upsertTokenCategory(token: {
  id: string
  categoryId: string
  lastHash: string
}) {
  return await db
    .insertInto('TokenCategory')
    .values(token)
    .onDuplicateKeyUpdate(token)
    .execute()
}

export async function getAllTokenCategories() {
  return await db
    .selectFrom('TokenCategory')
    .distinct()
    .select('categoryId')
    .execute()
}

export async function upsertTokens(
  tokens: Array<{
    commitment: string
    name: string
    categoryId: string
    image: string
    description: string | undefined
    attributes: string | null
  }>
) {
  await db.transaction().execute(async (trx) => {
    await Promise.all(
      tokens.map((token) => {
        trx
          .insertInto('TokenTypes')
          .values(token)
          .onDuplicateKeyUpdate(token)
          .execute()
      })
    )
  })
}
