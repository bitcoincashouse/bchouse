import { logger } from '@bchouse/utils'
import { CompiledQuery } from 'kysely'

export function logQuery<T extends { compile: () => CompiledQuery<any> }>(
  query: T
) {
  try {
    const compiled = query.compile()
    logger.info({ query: compiled.sql, parameter: compiled.parameters })
  } catch (err) {
    logger.error('Error compiling query', new Error().stack)
  }

  return query
}
