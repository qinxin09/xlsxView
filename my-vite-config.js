/**
 * author: 勤欣
 * tsconfig.node.json需配置include
 * "include": [..., "vite-webpack-config.ts"]
 */
/**
 * package.json
 * "dependencies": {
    "@types/node": "^22.5.5",
    "pinia": "^2.1.7",
    "vue": "^3.4.29",
    "vue-router": "^4.3.3"
  },
  "devDependencies": {
    "@rushstack/eslint-patch": "^1.8.0",
    "@tsconfig/node20": "^20.1.4",
    "@types/jsdom": "^21.1.7",
    "@types/node": "^22.5.5",
    "@vitejs/plugin-vue": "^5.1.4",
    "@vue/eslint-config-prettier": "^9.0.0",
    "@vue/eslint-config-typescript": "^13.0.0",
    "@vue/test-utils": "^2.4.6",
    "@vue/tsconfig": "^0.5.1",
    "eslint": "^8.57.0",
    "eslint-plugin-vue": "^9.23.0",
    "jsdom": "^24.1.0",
    "npm-run-all2": "^6.2.0",
    "prettier": "^3.2.5",
    "typescript": "~5.4.0",
    "vite": "^5.3.1",
    "vite-plugin-commonjs": "^0.10.3",
    "vite-plugin-top-level-await": "^1.4.4",
    "vite-plugin-vue-setup-extend": "^0.4.0",
    "vitest": "^1.6.0",
    "vue-tsc": "^2.0.21"
  }
 */
import { fileURLToPath, URL } from 'node:url'

// import VueSetupExtent from 'vite-plugin-vue-setup-extend' // 用于在script标签中配置组件名称
// https://vitejs.dev/config/
const viteConfig = {
  root: process.cwd(), // default // cnpm i --save-dev @types/node
  base: '/', // default
  mode: 'development', // default
  define: {
    __APP_VERSION__: JSON.stringify('v1.0.0') // project-root/vite-env.d.ts声明 declare const __APP_VERSION__: string// 浏览器中通过window.__APP_VERSION__访问
  },
  publicDir: 'public', // default
  cacheDir: 'node_modules/.vite', // default
  plugins: [],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    }
  },
  server: {
    port: 5173, //设置端口号
    open: true, //自动打开浏览器
    host: '0.0.0.0'
  },
  build: {
    //target: 'modules', // default  支持原生 ES 模块、原生 ESM 动态导入 和 import.meta 的浏览器。
    outDir: 'autojsPro-project/dist', // default dist 指定输出路径（相对于 项目根目录）
    assetsDir: 'assets' // default assets 指定生成静态资源的存放路径（相对于 build.outDir）。
  },
  /**
   *optimizeDeps 是 Vite 的一个配置选项，用于优化项目的依赖项。
预构建的目的主要有以下几个方面：
一、提高启动速度
在开发模式下，Vite 不需要进行全量的打包构建，而是按需加载模块。但对于一些大型的第三方库，每次按需加载可能会导致启动时间较长。通过预构建，这些库被提前打包成单个或几个文件，在启动时可以更快地加载，从而提高开发服务器的启动速度。
二、解决兼容性问题
某些老旧的库可能使用了 CommonJS 模块规范或者其他不被现代浏览器直接支持的模块格式。预构建可以将这些库转换为 ESM（ECMAScript Modules）格式，以便在浏览器中直接加载。同时，预构建还可以处理一些库中的循环依赖等问题，确保项目能够正常运行。
三、优化热更新性能
当项目中的代码发生变化时，Vite 会进行热更新，只重新加载发生变化的模块。如果没有预构建，热更新可能会因为需要重新解析和加载大型的第三方库而变得缓慢。预构建后，热更新可以更快速地定位和更新相关模块，提高开发效率。
   */
  optimizeDeps: {
    exclude: ['axios'],
    include: []
  }
}
const getViteConfig = async ({
  enableVitePluginVue = false,
  enableVitePluginTopLevelAwait = false,
  enableSetupNameSupport = false,
  enableVitePluginCommonjs = false
}) => {
  // 支持解析vue
  if (enableVitePluginVue) {
    // import vue from '@vitejs/plugin-vue'
    const mod = await import('@vitejs/plugin-vue')
    viteConfig.plugins.push(mod.default())
  }

  // 支持async/await
  if (enableVitePluginTopLevelAwait) {
    // 测试了async/await，若发现不能用则需要配置顶级语法支持
    /**
     * vite 不支持顶级的 async/await 语法，需要安装插件做兼容
     * vite.config.ts 安装并引入 topLevelAwait
     * cnpm install vite-plugin-top-level-await -D
     */

    // import topLevelAwait from 'vite-plugin-top-level-await'
    // const topLevelAwaitPlugin = topLevelAwait({
    //   promiseExportName: '__tla',
    //   promiseImportName: (i: number) => `__tla_${i}`
    // })
    // viteConfig.plugins.push(topLevelAwaitPlugin as never)
    const mod = await import('vite-plugin-top-level-await')
    const topLevelAwaitPlugin = mod.default({
      promiseExportName: '__tla',
      promiseImportName: (i) => `__tla_${i}`
    })
    viteConfig.plugins.push(topLevelAwaitPlugin)
  }
  // 支持在script标签中配置组件名称
  if (enableSetupNameSupport) {
    console.log('enableSetupNameSupport')
    // cnpm i --save-dev vite-plugin-vue-setup-extend
    // import VueSetupExtent from 'vite-plugin-vue-setup-extend' // 用于在script标签中配置组件名称
    // const vueSetupExtendPlugin = VueSetupExtent()
    // viteConfig.plugins.push(vueSetupExtendPlugin as never)
    const mod = await import('vite-plugin-vue-setup-extend')
    viteConfig.plugins.push(mod.default())
  }
  // 支持commonjs模块
  if (enableVitePluginCommonjs) {
    /**
     * 在组件中使用commonjs模块，但引用时注意当成esm模块来使用，且不能解构
     * cnpm i --save-dev vite-plugin-commonjs
     * ./commonjs.js
     * module.exports = {test: "this is commonjs模块" }
     * 组件中使用模块
     * import test from './commonjs' ;console.log(test)
     */
    // import commonjs from 'vite-plugin-commonjs' // cnpm i --save-dev vite-plugin-commonjs
    const commonjsPlugin = await import('vite-plugin-commonjs')
    viteConfig.plugins.unshift(commonjsPlugin.default()) // 要放在第一个，否则不生效
  }
  return viteConfig
}

export { getViteConfig }
