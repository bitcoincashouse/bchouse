import { createEnv } from '@t3-oss/env-core'
import { z } from 'zod'

export const appEnv = createEnv({
  server: {
    NODE_ENV: z.enum(['production', 'development', 'staging']),
    INNGEST_BRANCH: z.string(),
    INNGEST_EVENT_KEY: z.string(),
    INNGEST_SIGNING_KEY: z.string(),
    PAYGATE_URL: z.string(),
    BCHOUSE_URL: z.string(),
    PAYGATE_DATABASE_URL: z.string(),
    SESSION_SECRET: z.string(),
    JPP_SIGNING_KEY: z.string(),
    PAYGATE_PORT: z.number(),
  },
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
})
