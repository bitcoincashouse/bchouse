/** @type {import('@remix-run/dev').AppConfig} */
export default {
  ignoredRouteFiles: ['**/.*'],
  serverModuleFormat: 'esm',
  serverDependenciesToBundle: [/^@algolia\/.*/, /^react-easy-crop.*/],
  watchPaths: ['./remix.config.mjs', './server.ts', './server/**/*.ts'],
  serverBuildPath: './build/index.js',
  assetsBuildDirectory: './public/build',
  postcss: true,
  browserNodeBuiltinsPolyfill: {
    modules: {
      stream: true,
      url: true,
      buffer: true,
      events: true,
      string_decoder: true,
    },
  },
  // Note this ignores everything in routes/ giving you complete control over
  // your routes.  If you want to define routes in addition to what's in routes/,
  // change this to "ignoredRouteFiles": ["**/.*"].
  ignoredRouteFiles: ['**/.*'],
}
