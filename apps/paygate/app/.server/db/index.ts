import { appEnv } from 'appEnv'
import { Kysely } from 'kysely'
import { PlanetScaleDialect, inflateDates } from 'kysely-planetscale'
import { DB } from './types' // this is the Database interface we defined earlier
export * from './types'

const dialect = new PlanetScaleDialect({
  url: appEnv.PAYGATE_DATABASE_URL,
  cast: function inflate(field, value) {
    if (field.orgName === 'satoshis' || field.orgName === 'pledgedAmount') {
      return value !== null ? BigInt(value) : value
    }

    if (field.columnLength === 1 && field.type === 'INT64') {
      return Boolean(Number(value))
    }

    return inflateDates(field, value)
  },
})

// Database interface is passed to Kysely's constructor, and from now on, Kysely
// knows your database structure.
// Dialect is passed to Kysely's constructor, and from now on, Kysely knows how
// to communicate with your database.
export const db = new Kysely<DB>({
  dialect,
})
