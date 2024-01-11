import dotenv from 'dotenv'
import path, { resolve } from 'path'
import tsconfigPaths from 'vite-tsconfig-paths'
import { defineConfig } from 'vitest/config'

dotenv.config({
  path: resolve(__dirname, '../../_test.env'), // my env file that i'm using
})

export default defineConfig({
  plugins: [
    //@ts-ignore
    tsconfigPaths({
      root: path.resolve(__dirname),
    }),
  ],
  test: {
    env: process.env as Record<string, string>,
    poolOptions: {
      threads: {
        isolate: false,
      },
      forks: {
        isolate: false,
      },
    },
    environment: 'happy-dom',
    coverage: {
      reporter: [
        'text',
        'html',
        [
          'cobertura',
          {
            projectRoot: './src',
          },
        ],
      ],
    },
    passWithNoTests: true,
    chaiConfig: {
      // includeStack: true,
    },
  },
})
