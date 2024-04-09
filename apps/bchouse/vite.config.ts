import { vitePlugin as remix } from '@remix-run/dev'
import path from 'path'
import { remixDevTools } from 'remix-development-tools'
import { flatRoutes } from 'remix-flat-routes'
import { remixRoutes } from 'remix-routes/vite'
import { defineConfig } from 'vite'
import { cjsInterop } from 'vite-plugin-cjs-interop'
import svgr from 'vite-plugin-svgr'
import tsConfigPaths from 'vite-tsconfig-paths'
import run from './plugin/run'

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
    include: ['./app/entry.client.tsx', './app/root.tsx', './app/routes/**/*'],
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
    run([
      {
        name: 'cashscript',
        run: (parameters) => {
          const file = parameters?.file
          if (file) {
            const run = [
              'cashc',
              file,
              '--output',
              path.resolve(path.dirname(file), 'contract.json'),
            ]
            return run
          }

          return [
            'npx',
            'foreach',
            '-g',
            'app/.server/**/*.cash',
            '-x',
            'cashc #{path} --output #{dir}/contract.json',
          ]
        },
        pattern: ['**/*.cash'],
      },
      {
        name: 'xstate',
        run: (parameters) => {
          const file = parameters?.file
          if (file) {
            return ['npx', 'xstate', 'typegen', file]
          }

          return ['npx', 'xstate', 'typegen', 'app/**/*.machine.ts?(x)']
        },
        pattern: ['**/*.machine.ts?(x)'],
      },
    ]),
  ],
}))
