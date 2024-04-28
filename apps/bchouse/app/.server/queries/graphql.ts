import { initGraphQLTada } from 'gql.tada'
import type { introspection } from '../../../types/graphql-env.d.ts'

export const graphql = initGraphQLTada<{
  introspection: introspection
  scalars: {
    bytea: string
  }
}>()
