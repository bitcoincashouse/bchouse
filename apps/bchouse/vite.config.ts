import { vitePlugin as remix } from '@remix-run/dev'
import { remixDevTools } from 'remix-development-tools'
import { flatRoutes } from 'remix-flat-routes'
import { remixQuery } from 'remix-query/vite'
import { remixRoutes } from 'remix-routes/vite'
import { defineConfig } from 'vite'
import { cjsInterop } from 'vite-plugin-cjs-interop'
import svgr from 'vite-plugin-svgr'
import tsConfigPaths from 'vite-tsconfig-paths'
import run from './plugin/run'
import { cashscript } from './plugin/runners/cashscript'
import { xstate } from './plugin/runners/xstate'

export default defineConfig(({ isSsrBuild }) => ({
  ssr: {
    noExternal: ['react-easy-crop', 'lucide-react', '@heroicons/react'],
    target: 'node',
  },
  build: isSsrBuild
    ? {
        target: ['esnext'],
      }
    : {
        target: ['ES2022'],
      },
  optimizeDeps: {
    include: [
      './app/entry.client.tsx',
      './app/root.tsx',
      './app/routes/**/*',
      './app/utils/**/*',
      './app/components/**/*',
      '@clerk/remix/ssr.server',
      '@t3-oss/env-core',
    ],
    esbuildOptions: {
      target: 'esnext',
    },
  },
  server: {
    port: 3000,
    warmup: {
      clientFiles: [
        './app/entry.client.tsx',
        './app/root.tsx',
        './app/routes/**/*',
      ],
    },
  },
  plugins: [
    remixDevTools(),
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
    svgr(),
    remixRoutes(),
    remixQuery(),
    run([cashscript, xstate]),
  ],
}))
