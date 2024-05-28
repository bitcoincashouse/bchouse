import type * as Vite from 'vite'
import {
  DEFAULT_OUTPUT_DIR_PATH,
  build,
  buildHelpers,
  generateRuntimeFile,
} from './build.js'

interface PluginConfig {
  strict?: boolean
  outDir?: string
}

const RemixPluginContextName = '__remixPluginContext'
const virtualModuleId = 'virtual:remix-query/runtime'
const resolvedVirtualModuleId = '\0' + virtualModuleId

export function remixQuery(pluginConfig: PluginConfig = {}): Vite.Plugin {
  let remixPlugin: any
  let rootDirectory: string
  let viteUserConfig: Vite.UserConfig
  let viteConfigEnv: Vite.ConfigEnv
  let ctx: any

  function generateTypeFile() {
    if (!ctx) {
      return
    }
    build(rootDirectory, ctx.remixConfig, {
      strict: pluginConfig.strict,
      outputDirPath: pluginConfig.outDir || DEFAULT_OUTPUT_DIR_PATH,
    })
  }

  async function reloadCtx() {
    const config = await remixPlugin.config(viteUserConfig, viteConfigEnv)
    ctx = (config as any)[RemixPluginContextName]
  }

  return {
    name: 'remix-query',
    enforce: 'post',
    resolveId(id) {
      if (id === virtualModuleId) {
        return resolvedVirtualModuleId
      }
    },
    async load(id) {
      if (id === resolvedVirtualModuleId) {
        const [routesInfo, routeIds] = await buildHelpers(ctx.remixConfig)
        return generateRuntimeFile(
          rootDirectory,
          ctx.remixConfig,
          routesInfo,
          routeIds,
          {
            strict: pluginConfig.strict,
            outputDirPath: pluginConfig.outDir || DEFAULT_OUTPUT_DIR_PATH,
          }
        )
      }
    },
    config(_viteUserConfig, _viteConfigEnv) {
      viteUserConfig = _viteUserConfig
      viteConfigEnv = _viteConfigEnv
    },
    configResolved(config) {
      remixPlugin = config.plugins.find((plugin) => plugin.name === 'remix')
      if (!remixPlugin) {
        return
      }
      rootDirectory = config.root
      ctx = (config as any)[RemixPluginContextName]
      generateTypeFile()
    },
    async watchChange(id, change) {
      if (!remixPlugin) {
        return
      }
      if (change.event === 'update') {
        return
      }
      await reloadCtx()
      generateTypeFile()
    },
  }
}
