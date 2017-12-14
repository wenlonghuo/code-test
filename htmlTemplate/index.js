module.exports = function regTemplate (str, obj) {

  let pre = 'with(obj){var _str = "";_str +=\''

  // replace last single quote
  let arr = str.split('%>')
  arr[arr.length - 1] = arr[arr.length - 1].replace(/'/g, '\\\'')
  str = arr.join('%>')

  let evalStr = str
    // replace first single quote
    .replace(/([\s\S]*?)<%/m, function (str, $1) { return $1.replace(/'/g, '\\\'') + '<%' })
    // replace middle single quote
    .replace(/%>([\s\S]*?)<%/g, function (str, $1) { return '%>' + $1.replace(/'/g, '\\\'') + '<%' })
    .replace(/[\r\n\t]/g, ' ')
    .replace(/<%=([\s\S]*?)%>/g, "';_str +=$1;_str +='")
    .replace(/<%/g, "';")
    .replace(/%>/g, "_str+='")

  evalStr = pre + evalStr + "';return _str;}"
  var func = new Function ('obj', evalStr)
  return func(obj)
}

function changeQuote (str) {
  return str.replace(/'/g, '\\\'')
}