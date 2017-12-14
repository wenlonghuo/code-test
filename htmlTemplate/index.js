module.exports = function regTemplate (str, obj) {

  let pre = 'with(obj){var _str = "";_str +=\''

  let evalStr = str
    .replace(/<%=(.*?)%>/g, "';_str +=$1;_str +='")
    .replace(/<%/g, "';")
    .replace(/%>/g, "_str+='")

  evalStr = pre + evalStr + "';return _str;}"
  var func = new Function ('obj', evalStr)

  return func(obj)
}
