import { LoaderFunctionArgs } from '@remix-run/node'
import { z } from 'zod'
import { db } from '~/.server/db'
import { zx } from '~/utils/zodix'

const paramSchema = z.object({ address: z.string() })

export const loader = async (_: LoaderFunctionArgs) => {
  try {
    const { address } = zx.parseParams(_.params, paramSchema)

    const tokens = await db
      .selectFrom('TokenTypes as t')
      .where('currentOwnerAddress', '=', address)
      .select([
        'categoryId',
        'name',
        'description',
        'image',
        'attributes',
        'commitment',
      ])
      .limit(5)
      .execute()
      .then((rows) =>
        rows.map((row) => ({
          name: row.name,
          description: row.description,
          image: row.image,
          attributes:
            typeof row.attributes === 'string'
              ? JSON.parse(row.attributes)
              : typeof row.attributes === 'object'
              ? row.attributes
              : {},
          categoryId: row.categoryId,
          commitment: row.commitment,
        }))
      )

    return tokens
  } catch (err) {
    console.log(err)
    return []
  }
}
