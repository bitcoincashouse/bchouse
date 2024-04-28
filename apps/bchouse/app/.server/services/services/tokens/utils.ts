import { binToHex, sha256, utf8ToBin } from '@bitauth/libauth'
import { z } from 'zod'

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

async function importRegistryMetadata(uri: string) {
  try {
    const registryResp = await fetch(uri)
    const registryStr = await registryResp.text()
    const registry = bcmrSchema.parse(JSON.parse(registryStr))
    const hash = binToHex(sha256.hash(utf8ToBin(registryStr)))

    return {
      registry,
      hash,
    }
  } catch (err) {
    console.log(err)
    throw err
  }
}

export async function importTokenRegistryMetadata(tokenId: string) {
  return importRegistryMetadata(`${bcmrIndexer}/registries/${tokenId}/latest`)
}
