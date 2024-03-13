import { vitePlugin as remix } from '@remix-run/dev'
import { flatRoutes } from 'remix-flat-routes'
import { defineConfig } from 'vite'
import { cjsInterop } from 'vite-plugin-cjs-interop'
import tsConfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  ssr: {
    noExternal: ['react-easy-crop', 'lucide-react', '@heroicons/react'],
    target: 'node',
  },
  build: {
    target: ['ES2022'],
  },
  server: {
    port: 3000,
  },
  plugins: [
    tsConfigPaths(),
    cjsInterop({
      dependencies: ['@algolia/autocomplete-js', 'react-easy-crop', 'tslib'],
    }),
    remix({
      serverModuleFormat: 'esm',
      future: {
        v3_fetcherPersist: true,
      },
      ignoredRouteFiles: ['**/*'],
      routes: async (defineRoutes) => {
        return flatRoutes('routes', defineRoutes, {
          ignoredRouteFiles: ['**/.*', '**/*.test.tsx'],
        })
      },
    }),
  ],
})
