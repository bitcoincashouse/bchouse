import { createEnv } from '@t3-oss/env-core'
import { z } from 'zod'

export const appEnv = createEnv({
  server: {
    NODE_ENV: z.enum(['production', 'development', 'staging']),
    SENTRY_DSN: z.string().optional(),
    API_SECRET: z.string().optional(),
    REDIS_URL: z.string().url(),
    PAYGATE_URL: z
      .string()
      .url()
      .transform((url) => url.replace(/\/$/, '')),
    BCHOUSE_URL: z
      .string()
      .url()
      .transform((url) => url.replace(/\/$/, '')),
    BCHOUSE_DATABASE_URL: z.string().url(),
    BCH_NETWORK: z.enum(['mainnet', 'chipnet']),
    JPP_SIGNING_KEY: z.string(),
    SESSION_SECRET: z.string(),
    TYPESENSE_PUBLIC_URL: z.string().url(),
    TYPESENSE_PUBLIC_API_KEY: z.string(),
    TYPESENSE_REBUILD_INDEX: z.string(),
    TYPESENSE_API_KEY: z.string(),
    TYPESENSE_URL: z.string().url(),
    SNOWFLAKE_EPOCH: z.coerce.number(),
    SNOWFLAKE_WORKER_ID: z.coerce.number(),
    INNGEST_BRANCH: z.string(),
    INNGEST_EVENT_KEY: z.string(),
    INNGEST_SIGNING_KEY: z.string(),
    STORAGE_ACCESS_KEY: z.string(),
    STORAGE_SECRET_KEY: z.string(),
    STORAGE_BUCKET: z.string(),
    STORAGE_PUBLIC_URL: z.string(),
    STORAGE_API_URL: z.string(),
    STORAGE_REGION: z.string().optional(),
    STORAGE_PATH_STYLE: z.string(),
    CLERK_SECRET_KEY: z.string(),
    CLERK_WEBHOOK_SECRET: z.string(),
    CLERK_SIGNIN_WEBHOOK_SECRET: z.string(),
    FLIPSTARTER_PLATFORM_ADDRESS: z.string(),
    FLIPSTARTER_PLATFORM_PUBKEY: z.string(),
    FLIPSTARTER_PLATFORM_PRIVKEY: z.string(),
    WALLET_CONNECT_PROJECT_ID: z.string(),
    // NICKNAME: z.string().min(1),
    // LLAMA_COUNT: z.number().int().positive(),
    // COLOR: z.enum(["red", "blue"]),
    // SHINY: z.boolean().default(true),
  },
  runtimeEnv: typeof process !== 'undefined' ? process.env : {},
  emptyStringAsUndefined: true,
})
