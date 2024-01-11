import path from 'path'
import tsconfigPaths from 'vite-tsconfig-paths'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [
    //@ts-ignore
    tsconfigPaths({
      root: path.resolve(__dirname),
    }),
  ],
  test: {
    globals: true,
    coverage: {
      reporter: ['text', 'html'],
    },
    environment: './test/test-environment.ts',
    chaiConfig: {
      // includeStack: true,
    },
    poolOptions: {
      singleThread: true,
      maxForks: 1,
    },
  },
})
