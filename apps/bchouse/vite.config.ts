import { vitePlugin as remix } from '@remix-run/dev'
import { flatRoutes } from 'remix-flat-routes'
import { defineConfig } from 'vite'
import { cjsInterop } from 'vite-plugin-cjs-interop'
import tsConfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  ssr: {
    noExternal: [
      'react-easy-crop',
      'lucide-react',
      '@heroicons/react/24/outline',
      '@heroicons/react/24/solid',
      '@heroicons/react/16/solid',
      '@heroicons/react/16/outline',
    ],
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
      // serverDependenciesToBundle: [
      //   /^@algolia\/.*/,
      //   /^react-easy-crop.*/,
      //   /^usehooks-ts.*/,
      // ],
      // watchPaths: ['./tailwind.config.mjs', './remix.config.mjs'],
      // serverBuildPath: './build/index.js',
      // assetsBuildDirectory: './public/build',
      // tailwind: true,
      // postcss: true,
      future: {
        v3_fetcherPersist: true,
      },

      // browserNodeBuiltinsPolyfill: {
      //   modules: {
      //     stream: true,
      //     url: true,
      //     buffer: true,
      //     events: true,
      //     string_decoder: true,
      //   },
      // },
      // Note this ignores everything in routes/ giving you complete control over
      // your routes.  If you want to define routes in addition to what's in routes/,
      // change this to "ignoredRouteFiles": ["**/.*"].
      ignoredRouteFiles: ['**/*'],
      routes: async (defineRoutes) => {
        return flatRoutes('routes', defineRoutes, {
          ignoredRouteFiles: ['**/.*', '**/*.test.tsx'],
        })
      },
    }),
  ],
})
