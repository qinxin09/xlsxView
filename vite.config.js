import { defineConfig } from 'vite'
import { getViteConfig } from './my-vite-config'
// import "./server.node.js";
import "./autojsPro-project/server-bridge.mjs";
// https://vitejs.dev/config/
export default defineConfig(
  await getViteConfig({
    enableVitePluginVue: true,
    // enableVitePluginCommonjs: true,
    // enableVitePluginTopLevelAwait: true,// 目前看来，vite默认是支持的,不用手动配置，有些版本的vite可能需要手动配置（解除注释）
    enableSetupNameSupport: true
  })
)
