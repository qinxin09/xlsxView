// import express from 'express'
// import path from 'path'
// globalThis.__dirname == undefined && (globalThis.__dirname = path.resolve())
// import fs from 'fs'
// import cors from 'cors'
// import https from 'https'
// import http from 'http'
// import os from 'os'

const express = require('express')
const path = require('path')
const fs = require('fs')
const cors = require('cors')
const https = require('https')
const http = require('http')
const os = require('os')
// 类型 cnpm i @types/express
const app = express()
let server
function R(res, data, msg) {
  const cbs = {
    success({ data, msg }) {
      res.json({
        code: 200,
        data,
        msg
      })
    },
    error({ data, msg }) {
      res.json({
        code: 400,
        data,
        msg
      })
    }
  }
}
const exportModule = {
  app,
  init (dist=null) {
    if (dist) {
      console.log('静态资源目录：', dist)
      app.use(express.static(dist)) // 静态资源目录
    }
    app.use(
      cors({
        origin: '*',
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
        preflightContinue: false,
        optionsSuccessStatus: 204
      })
    )
    app.use((req, res, next) => {
      res.header('Access-Control-Allow-Origin', '*')
      res.header('Access-Control-Allow-Headers', 'X-Requested-With')
      res.header('Access-Control-Allow-Methods', 'PUT,POST,GET,DELETE,OPTIONS')
      res.header('X-Powered-By', ' 3.2.1')
      res.header('Content-Type', 'application/json;charset=utf-8')
      next()
    })
    app.use(express.json())
    app.use(
      express.urlencoded({
        extended: true
      })
    ) // 解析post请求
    // 配置中间件：处理二进制数据
    app.use(
      express.raw({
        type: 'application/octet-stream',
        limit: '100mb' // 根据文件大小调整限制
      })
    )
  },
  //拦截器
  interceptor(cb) {
    // @ts-ignore
    app.use(cb)
  },
  download(api = '/api/download') {
    app.get(api, (req, res) => {
      // req.headers['Log-File']
      let fullpath = req.query.fullpath + ''
      if (fs.existsSync(fullpath)) {
        // 设置 Content-Disposition header，指定文件名
        // 对文件名进行 URL 编码
        const filename = encodeURIComponent(path.basename(fullpath))
        const stat = fs.statSync(fullpath)
        const fileSize = stat.size
        const lastModified = stat.mtime.toUTCString()

        res.setHeader('Content-Length', fileSize)
        // 设置 Content-Disposition header，指定文件名
        res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition')
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
        res.setHeader('Last-Modified', lastModified)
        // 以流的方式将文件发送给客户端
        const fileStream = fs.createReadStream(fullpath)
        fileStream.pipe(res)
      } else {
        res.status(404).send('文件不存在,fullpath:' + fullpath)
      }
    })
  },
  start (port, options=null) {
    let type = 'HTTP'
    if (options) {
      server = https.createServer(options, app)
      port = port || 443
      type = 'HTTPS'
    } else {
      server = http.createServer(app); // 使用 http.createServer 包装 app
      port = port || 80
    }
    const ipv4 = this.getEnv().ipv4?.address
    const url = `${type}://${ipv4 == undefined ? 'localhost' : ipv4}:${port}`.toLowerCase()
    server.listen(port, () => {
      console.log(`${type} Express server running on port ${port}`)
      console.log('欢迎使用，访问地址为 ' + url)
    })
    return url
  },
  close() {
    server.close()
  },
  getEnv() {
    let result = {
      deviceInfo: {},
      storageRoots: []
    }
    result.platform = os.platform()
    // @ts-ignore
    result.isAutojsPro = globalThis.$autojs != undefined
    result.arch = os.arch()
    result.userInfo = os.userInfo()
    // 获取全局环境变量
    result.storageRoots = []
    switch (result.platform.toLowerCase()) {
      case 'win32':
        'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').filter((d) => fs.existsSync(`${d}:\\`) && result.storageRoots.push(`${d}:`))
        result.deviceInfo.name = os.hostname() // 输出：MacBookPro18,3
        break
      case 'android':
        result.deviceInfo.name = os.hostname() // 输出：MacBookPro18,3
        result.storageRoots = ['/storage/emulated/0', '/storage']
    }
    // 获取网络接口
    const ifaces = os.networkInterfaces()
    // 遍历网络接口
    Object.keys(ifaces).forEach((iface) => {
      // 查找IPv4地址
      result.ipv4 = ifaces[iface].find((addr) => addr.family.toLowerCase() === 'ipv4' && !addr.internal)
    })
    // 遍历网络接口
    for (let wk in ifaces) {
      // 如果接口名称以wlan开头
      if (wk.toLowerCase().startsWith('wlan')) {
        // 查找IPv4地址
        result.ipv4 = {
          name: wk,
          ...ifaces[wk].find((addr) => addr.family.toLowerCase() === 'ipv4' && !addr.internal)
        }
        break
        // 如果接口名称以以太网开头
      } else if (wk.toLowerCase().startsWith('以太网')) {
        // 查找IPv4地址
        result.ipv4 = {
          name: wk,
          ...ifaces[wk].find((addr) => addr.family.toLowerCase() === 'ipv4' && !addr.internal)
        }
        break
        // 如果接口名称以rmnet开头且不以rmnet_开头
      } else if (wk.toLowerCase().startsWith('rmnet') && !wk.toLowerCase().startsWith('rmnet_')) {
        // 手机移动网络
        // 查找IPv4地址
        result.ipv4 = {
          name: wk,
          ...ifaces[wk].find((addr) => addr.family.toLowerCase() === 'ipv4' && !addr.internal)
        }
        break
      }
    }
    // 返回结果
    return result
  }
}
module.exports = exportModule