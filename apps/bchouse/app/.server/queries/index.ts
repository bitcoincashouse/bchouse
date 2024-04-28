import { graphql } from './graphql'

export const TokenQueryPaginated = graphql(`
  query TokenQueryPaginated($limit: Int, $offset: Int, $categoryId: bytea) {
    output(
      where: { token_category: { _eq: $categoryId }, _not: { spent_by: {} } }
      limit: $limit
      offset: $offset
    ) {
      locking_bytecode
      transaction {
        hash
        block_inclusions {
          block {
            height
          }
        }
      }
      output_index
      nonfungible_token_commitment
    }
  }
`)

export const TokenSubscriptionFromBlock = graphql(`
  subscription TokenQueryFromBlock($block: bigint, $categoryId: bytea) {
    output(
      where: {
        token_category: { _eq: $categoryId }
        _not: { spent_by: {} }
        transaction: {
          _or: [
            { block_inclusions: { block: { height: { _gte: $block } } } }
            { _not: { block_inclusions: {} } }
          ]
        }
      }
    ) {
      locking_bytecode
      transaction {
        hash
        block_inclusions {
          block {
            height
          }
        }
      }
      output_index
      nonfungible_token_commitment
    }
  }
`)
