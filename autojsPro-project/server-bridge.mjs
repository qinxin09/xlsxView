// server/server-bridge.mjs
import { createRequire } from 'module'
import { fileURLToPath } from 'url'
import path from 'path'

// 创建一个 require 函数，用于加载 CJS 模块
const require = createRequire(import.meta.url)
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
// 安全加载原始 CJS 模块
const serverCJS = require('./server.node.js')

// 导出为 ESM
export default serverCJS
