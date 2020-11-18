'use strict'

const path = require('path')
const http = require('http')
const fs = require('fs')

const Koa = require('koa')
const router = require('koa-router')()
const sendFile = require('koa-send')
const formidable = require('formidable')

const app = new Koa()
const appPORT = 8088

app.proxy = true

// 静态服务器 添加默认为Index.html
app.use(async function (ctx, next) {
  ctx.set({
    'Access-Control-Allow-Origin': ctx.headers.origin,
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Headers': '*',
    'Access-Control-Allow-Methods': 'PUT, POST, GET, DELETE, OPTIONS',
  })
  if (ctx.method === 'OPTIONS') {
    ctx.body = ''
    return
  }
  await next()
  if (!ctx.body) {
    await sendFile(ctx, ctx.path, {root: path.join(__dirname, '../web/'), index: 'index.html'})
  }
})

function promiseForm (req) {
  return new Promise((resolve, reject) => {
    const uploadForm = new formidable.IncomingForm()
    // mac 下不支持自定义路径，需要手动修改路径
    // uploadForm.uploadDir = path.join(__dirname, './uploads')
    uploadForm.maxFileSize = 300 * 1024 * 1024
    uploadForm.multiples = true
    uploadForm.parse(req, function (err, fields, files) {
      if (err) {
        return reject(err)
      }
      resolve({ fields, files })
    })
  })
}

// 上传文件路径
router.post('*', async function (ctx, next) {
  try {
    const result = await promiseForm(ctx.req)
    console.log(ctx)
    const { files } = result
    // 切换文件保存位置
    const fileArr = Object.keys(files).map(name => { return { name, files: files[name] } })
    const resultArr = []
    console.log(fileArr)
    fileArr.forEach((fileInfo) => {
      let files = fileInfo.files
      if (!Array.isArray(files)) {
        files = [ files ]
      }
      files.forEach(file => {
        const filenames = file.name.split('/')
        const filename = filenames[filenames.length - 1]
        const newPath = `/upload/${filename}`
        fs.renameSync(file.path, path.join(__dirname, '../web/upload/', filename))
        resultArr.push({
          name: filename,
          url: newPath
        })
      })
    })

    if (resultArr.length === 1) {
      ctx.body = {
        result: resultArr[0].url
      }
      return
    }
    ctx.body = resultArr
  } catch (e) {
    ctx.body = {
      e: e.message,
      stack: e.stack
    }
  }
})

app.use(router.routes())

const httpServer = http.createServer(app.callback())

httpServer.on('clientError', (err, socket) => {
  socket.end('HTTP/1.1 400 Bad Request\r\n\r\n')
})

httpServer.listen(appPORT, function (e) {
  console.log('服务运行于: http://localhost:%s', appPORT)
})

process.on('unhandledRejection', function (e) {
  throw e
})
