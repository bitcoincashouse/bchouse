import { createEnv } from '@t3-oss/env-core'
import { z } from 'zod'

export const appEnv = createEnv({
  server: {
    NODE_ENV: z.enum(['production', 'development', 'staging']),
    PAYGATE_URL: z
      .string()
      .url()
      .transform((url) => url.replace(/\/$/, '')),
    BCHOUSE_URL: z
      .string()
      .url()
      .transform((url) => url.replace(/\/$/, '')),
    UMBRACO_URL: z
      .string()
      .url()
      .transform((url) => url.replace(/\/$/, '')),
    E2E_TEST_USERNAME: z.string(),
    E2E_TEST_USER_PASSWORD: z.string(),
    E2E_TEST_USER_BCH_ADDRESS: z.string(),
  },
  runtimeEnv: typeof process !== 'undefined' ? process.env : {},
  emptyStringAsUndefined: true,
})
