const sqip = require('sqip')
const glob = require('glob')
const path = require('path')
const fs = require('fs')

function getSvgList (folder) {
  return new Promise((resolve, reject) => {
    glob(folder + '/**/*.jpg', {}, function (err, files) {
      if (err) {
        reject(err)
      }
      let list = []
      files.forEach(file => {
        const result = sqip({
          filename: file,
          numberOfPrimitives: 10,
        })
        list.push({
          file: path.join(__dirname, file),
          result,
        })
      })
      resolve(list)
    })
  })
}

function replaceHtml (html, list) {
  if (!path.isAbsolute(html)) {
    html = path.join(__dirname, html)
  }
  let str = fs.readFileSync(html, 'utf-8')
  let htmlPath = path.dirname(html)
  const REG = /(<img .*?src=\")(.*?)\"( .*?>)/g

  let imgSrc = REG.exec(str)

  while (imgSrc) {
    let src = imgSrc[2]
    let file
    if (path.isAbsolute(src)) {
      file = path.join(__dirname, src)
    } else {
      file = path.join(htmlPath, src)
    }
    list.forEach(item => {
      if (item.file === file) {
        var imgInfo = item.result.img_dimensions
        str = str.replace(imgSrc[0], function (str) {
          return imgSrc[1] + 'data:image/svg+xml;base64,' + item.result.svg_base64encoded + `" data-width="${imgInfo.width}" data-height="${imgInfo.height}"`
            + ` data-src="${src}"` + imgSrc[3]
        })
      }
    })

    imgSrc = REG.exec(str)
  }

  fs.writeFileSync('./example/index.html', str)
}

getSvgList('./example/images/')
  .then(list => {
    replaceHtml('./example/index.tmpl', list)
  })