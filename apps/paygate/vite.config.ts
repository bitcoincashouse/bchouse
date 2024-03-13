import { vitePlugin as remix } from '@remix-run/dev'
import { flatRoutes } from 'remix-flat-routes'
import { defineConfig } from 'vite'
import tsConfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  ssr: {
    noExternal: [],
    target: 'node',
  },
  build: {
    target: ['ES2022'],
  },
  server: {
    port: 3002,
  },
  plugins: [
    tsConfigPaths(),
    remix({
      serverModuleFormat: 'esm',
      ignoredRouteFiles: ['**/*'],
      routes: async (defineRoutes) => {
        return flatRoutes('routes', defineRoutes, {
          ignoredRouteFiles: ['**/.*', '**/*.test.tsx'],
        })
      },
    }),
  ],
})
