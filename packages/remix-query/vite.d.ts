import type * as Vite from 'vite'
interface PluginConfig {
  strict?: boolean
  outDir?: string
}

export declare function remixQuery(
  pluginConfig: PluginConfig = {}
): Vite.Plugin
