import { lockingBytecodeToAddress } from '@bchouse/utils'
import { CombinedError, OperationResult } from '@urql/core'
import { ResultOf } from 'gql.tada'
import { TokenSubscriptionFromBlock } from '~/.server/queries'
import { client } from './client'
import { getAllTokenCategories, updateTokenOwners } from './db'

export async function subscribeToTokenUpdates() {
  console.log('Starting token subscriptions')

  const categoryRows = await getAllTokenCategories()

  const callbacks: Array<() => void> = []
  for (let i = 0; i < categoryRows.length; i++) {
    const { categoryId } = categoryRows[i] || {}
    if (!categoryId) continue

    try {
      callbacks.push(subscribeTokenUpdates(categoryId).unsubscribe)
    } catch (err) {
      console.log('Error subscribing to token', categoryId)
    }
  }

  console.log('Started token subscriptions')
  return () => callbacks.map((callback) => callback())
}

function handleTokenSubscriptionError(
  categoryId: string,
  error: CombinedError
) {
  if (error.networkError) {
    //TODO: Alert to Sentry that subscription is down.
    //TODO: Save current block height to subscribe to when back online.
    console.log('Token subscription error', categoryId, error)
  }
}

async function handleTokenSubscriptionUpdate(
  categoryId: string,
  data: ResultOf<typeof TokenSubscriptionFromBlock>
) {
  //TODO: update token owner information
  console.log(`Token ${categoryId} updated`, data.output)

  const updatedTokens = data.output
    .map((output) => {
      const commitment = output.nonfungible_token_commitment?.slice(2)
      if (!commitment) return null

      const currentOwnerAddress = lockingBytecodeToAddress(
        output.locking_bytecode.slice(2)
      )

      return {
        commitment,
        categoryId,
        currentOwnerAddress,
      }
    })
    .filter(Boolean)

  await updateTokenOwners(updatedTokens)
}

type SubscriptionContext = {
  unsubscribe?: () => void
}

function handleTokenSubscription(categoryId: string, ctx: SubscriptionContext) {
  return (
    result: OperationResult<ResultOf<typeof TokenSubscriptionFromBlock>>
  ) => {
    if (result.error) {
      handleTokenSubscriptionError(categoryId, result.error)
    } else if (result.data) {
      handleTokenSubscriptionUpdate(categoryId, result.data)
    } else {
      console.log('Unknown token response', categoryId, result)
    }
  }
}

function subscribeTokenUpdates(categoryId: string) {
  const context: SubscriptionContext = {
    unsubscribe: undefined,
  }

  const { unsubscribe } = client
    .subscription(TokenSubscriptionFromBlock, {
      categoryId: '\\x' + categoryId,
      //TODO: Get block to subscribe from based on last block processed?
      block: 843063,
    })
    .subscribe(handleTokenSubscription(categoryId, context))

  context.unsubscribe = unsubscribe

  //TODO: handle unsubscribing either when unpublished/deleted or when tearing down application
  return { unsubscribe }
}
