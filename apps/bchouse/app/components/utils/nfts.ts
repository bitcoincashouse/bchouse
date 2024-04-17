import { ElectrumNetworkProvider, Utxo } from 'cashscript'
import { z } from 'zod'
type TokenUtxo = Utxo & { token: NonNullable<Utxo['token']> }
type NFTUtxo = TokenUtxo & {
  token: TokenUtxo['token'] & { nft: NonNullable<TokenUtxo['token']['nft']> }
}
type FTUtxo = TokenUtxo & { token: Omit<TokenUtxo['token'], 'nft'> }

const validTokens = [
  '77a95410a07c2392c340384aef323aea902ebfa698a35815c4ef100062c6d8ac',
  '07a70ec6e0a325991e829daea5de1be1bb71e1ef4a04931cdddf567d8f60f676',
  '180f0db4465c2af5ef9363f46bacde732fa6ffb3bfe65844452078085b2e7c93',
  'f54ce0297a4017cc922aacde5f7abe7a8397a1058b879f5eb9e2a643d4ec2301',
  '482d555258d3be69fef6ffcd0e5eeb23c4aaacec572b25ab1c21897600c45887',
  'b1899ba19c167d4ea9dcc64516b6295cdd7616b179b4146f461aacc623e14be6',
  'd9ab24ed15a7846cc3d9e004aa5cb976860f13dac1ead05784ee4f4622af96ea',
]

const metadataRegistry = [
  'https://otr.cash/.well-known/bitcoin-cash-metadata-registry.json',
]

const bcmrIndexer = 'https://bcmr.paytaca.com/api'

const bcmrSchema = z
  .object({
    identities: z.record(
      z.string(), //tokenId
      z.record(
        z.string(), //date
        z.object({
          name: z.string().optional(),
          description: z.string().optional(),
          token: z
            .object({
              category: z.string(),
              symbol: z.string().optional(),
              decimals: z.coerce.number().optional(),
              nfts: z
                .object({
                  description: z.string().optional(),
                  parse: z
                    .object({
                      types: z
                        .record(
                          z.string(),
                          z.object({
                            name: z.string().optional(),
                            description: z.string().optional(),
                            uris: z
                              .object({
                                icon: z.string().optional(),
                                image: z.string().optional(),
                              })
                              .optional(),
                            extensions: z
                              .object({
                                attributes: z
                                  .record(z.string(), z.coerce.string())
                                  .optional(),
                              })
                              .optional(),
                          })
                        )
                        .optional(),
                    })
                    .optional(),
                })
                .optional(),
            })
            .optional(),
          splitId: z.string().optional(),
          uris: z
            .object({
              icon: z.string().optional(),
              web: z.string().optional(),
              chat: z.string().optional(),
              app: z.string().optional(),
              image: z.string().optional(),
            })
            .optional(),
        })
      )
    ),
  })
  .passthrough()

const registries: Array<z.infer<typeof bcmrSchema>> = []

function isTokenUtxo(utxo?: Utxo): utxo is TokenUtxo {
  return !!utxo?.token
}

function isNFTUtxo(utxo?: Utxo): utxo is NFTUtxo {
  return !!utxo?.token && !!utxo.token.nft
}

function isFTUtxo(utxo?: Utxo): utxo is FTUtxo {
  return !!utxo?.token && !utxo.token.nft
}

function getTokenMetadata(utxo: TokenUtxo) {
  for (let i = 0; i < registries.length; i++) {
    const identity = registries[i]?.identities[utxo.token.category]
    if (!identity) continue
    const latestKey = Object.keys(identity)[0]
    if (latestKey && identity[latestKey]) {
      return identity[latestKey]
    }
  }

  return null
}

async function importRegistryMetadata(uri: string) {
  try {
    const registryResp = await fetch(uri)
    const registryJson = bcmrSchema.parse(await registryResp.json())
    registries.push(registryJson)
  } catch (err) {
    console.log(err)
  }
}

async function importTokenRegistryMetadata(tokenId: string) {
  return importRegistryMetadata(`${bcmrIndexer}/registries/${tokenId}/latest`)
}

let isLoaded = false
export async function getAddressTokens(
  electrum: ElectrumNetworkProvider,
  address: string
) {
  try {
    console.log({ isLoaded })

    if (!isLoaded) {
      isLoaded = true
      await Promise.all(
        validTokens.map((tokenId) =>
          importTokenRegistryMetadata(tokenId).catch((err) => {
            console.log('Error loading tokens', tokenId, err)
            isLoaded = false
          })
        )
      )
    }

    const utxos = await electrum.getUtxos(address)

    const tokens: Array<TokenUtxo> = []
    const nfts: Array<NFTUtxo> = []
    const fts: Array<FTUtxo> = []
    const categories = new Set<string>()

    const displayTokens: Array<{
      name?: string
      description?: string
      attributes?: Record<string, string>
      image?: string
    }> = []

    for (let i = 0; i < utxos.length; i++) {
      const utxo = utxos[i]
      if (!isTokenUtxo(utxo)) {
        console.log('not token')
        continue
      }

      const metadata = getTokenMetadata(utxo)
      if (!metadata) {
        console.log('not valid token', utxo.token.category)
        continue
      }

      tokens.push(utxo)

      if (isNFTUtxo(utxo)) {
        nfts.push(utxo)
        const nftMetadata =
          metadata.token?.nfts?.parse?.types?.[utxo.token.nft.commitment]
        if (nftMetadata) {
          const displayToken = {
            description: nftMetadata.description,
            attributes: nftMetadata.extensions?.attributes,
            image: nftMetadata.uris?.icon || nftMetadata.uris?.image,
            name: nftMetadata.name,
          }

          if (displayToken.image && displayToken.name)
            displayTokens.push(displayToken)
        }
      } else if (isFTUtxo(utxo)) {
        fts.push(utxo)
      }

      categories.add(utxo.token.category)
    }

    return {
      tokens,
      nfts,
      fts,
      categories,
      displayTokens,
    }
  } catch (err) {
    console.log(err)
    return {
      tokens: [],
      nfts: [],
      fts: [],
      categories: [],
    }
  }
}
