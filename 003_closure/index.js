(function () {
  var a = 1
  var cuse = 2
  var unuse = 10

  function second () {
    var b = a

    function third() {
      var d = 'xx'
      
      function four () {
        var c = b
        c += a
        c += cuse
        console.log(c)

        eval('(console.log(d))')
      }
      four()
      console.log(d)
    }
    third()
  }

  second()

  var final = unuse + 1
  return final
})()