import { lockingBytecodeToAddress } from '@bchouse/utils'
import { QueryClient } from '@tanstack/react-query'
import expand from 'expand-template'
import { TokenQueryPaginated } from '~/.server/queries'
import { client } from './client'
import {
  getLatestHash,
  updateTokenOwners,
  upsertTokenCategory,
  upsertTokens,
} from './db'
import { importTokenRegistryMetadata } from './utils'

const queryClient = new QueryClient()

export async function loadNFTTypes(id: string, categoryId: string) {
  const { registry, hash } = await queryClient.fetchQuery({
    queryKey: ['registryFetch', categoryId],
    queryFn: () => importTokenRegistryMetadata(categoryId),
    gcTime: 1000 * 60 * 60,
  })

  const { lastHash } = await getLatestHash(categoryId)

  //If hash is updated, return latest identity types for nft
  if (!lastHash || lastHash !== hash) {
    try {
      const token = {
        id,
        categoryId: categoryId,
        lastHash: hash,
      }

      await upsertTokenCategory(token)

      const identity = registry.identities[categoryId]
      if (identity) {
        const latestKey = Object.keys(identity)[0] || ''
        const latestIdentity = identity[latestKey]
        if (latestIdentity && latestIdentity.token?.nfts?.parse?.types) {
          return latestIdentity.token.nfts.parse.types
        }
      }
    } catch (err) {
      console.log('Error parsing latest token registry identitity', err)
      throw err
    }
  }

  return null
}

export async function updateNFTTypes(
  id: string,
  properties: {
    categoryId: string
    registry: {
      Url?: string
      Title?: string
      Target?: '_blank'
      LinkType?: 'External'
    }[]
    link: {
      Url?: string
      Title?: string
      Target?: '_blank'
      LinkType?: 'External'
    }[]
    iconRepository?: string
    imageRepository?: string
  }
) {
  let batchSize = 20

  const types = await loadNFTTypes(id, properties.categoryId)
  if (types) {
    const commitments = Object.keys(types)
    for (let i = 0; i < commitments.length; i += batchSize) {
      const tokens = commitments
        .slice(i, i + batchSize)
        .map((commitment) => {
          const tokenInfo = types[commitment]
          let tokenImage

          if (properties.imageRepository) {
            tokenImage = expand(properties.imageRepository, {
              commitmentHex: commitment,
              commitmentDecimal: parseInt(commitment, 16),
            })
          } else if (properties.iconRepository) {
            tokenImage = expand(properties.iconRepository, {
              commitmentHex: commitment,
              commitmentDecimal: parseInt(commitment, 16),
            })
          } else {
            tokenImage = tokenInfo?.uris?.image || tokenInfo?.uris?.icon
          }

          const tokenName = tokenInfo?.name

          if (tokenInfo && tokenName && tokenImage) {
            //TODO: Save image to S3.
            //TODO: Save token information in batches for speed
            return {
              commitment,
              name: tokenName,
              categoryId: properties.categoryId,
              image: tokenImage,
              description: tokenInfo.description,
              attributes:
                JSON.stringify(tokenInfo.extensions?.attributes) || null,
            }
          }
          {
            return null
          }
        })
        .filter(Boolean)

      await upsertTokens(tokens)
    }
  }
}

export async function initialTokenLoad(categoryId: string) {
  const limit = 100
  let offset = 0

  let hasMoreResults = true
  console.log('initial token load')
  while (hasMoreResults) {
    console.log(`Fetching batch ${offset} - ${offset + limit}`)
    hasMoreResults = false

    const response = await client
      .query(TokenQueryPaginated, {
        categoryId: '\\x' + categoryId,
        limit: limit + 1,
        offset,
      })
      .toPromise()

    if (response.error) {
      console.log('Error fetching token results', response.error)
      throw response.error
    } else if (response.data) {
      const outputs = response.data.output
      console.log(`Fetched ${outputs.length}`)
      offset += limit
      hasMoreResults = outputs && 'length' in outputs && outputs.length > limit

      //Update current owners of nft type
      //TODO: must handle nfts where multiple users own same type
      const tokens = outputs
        .map((output) => {
          const commitment = output?.nonfungible_token_commitment?.slice(2)
          if (!output || !commitment) {
            return null
          }

          const lockingBytecode = output.locking_bytecode.slice(2)
          const currentOwnerAddress = lockingBytecodeToAddress(lockingBytecode)
          return {
            currentOwnerAddress,
            categoryId,
            commitment,
          }
        })
        .filter(Boolean)

      await updateTokenOwners(tokens)
    }
  }

  console.log('done initial token load')
}
