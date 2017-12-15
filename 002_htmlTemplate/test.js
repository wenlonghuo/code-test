'use strict'
const assert = require('assert')

const regTemplate = require('./index')


describe('test just variable', function () {
  
  it('variable', function () {
    const equalTmpl = '<html><body><%= name %></body></html>'
    const afterCompile = '<html><body>hello</body></html>'
    const obj = {
      name: 'hello',
    }
    let result = regTemplate(equalTmpl, obj)
    assert.equal(result, afterCompile)
  })
})

describe('test value and expression', function () {
  
  it('single line', function () {
    const equalTmpl = '<html><body><%= name %><% for(var i = 0; i < 2; i++) {%><div><%= i %></div><% } %></body></html>'
    const afterCompile = '<html><body>hello<div>0</div><div>1</div></body></html>'
    const obj = {
      name: 'hello',
    }
    let result = regTemplate(equalTmpl, obj)
    assert.equal(result, afterCompile)
  })

  it('multi line', function () {
    const equalTmpl = '<html><body>\n\t<%= name %><% for(var i = 0; i < 2; i++) {%>\n<div><%= i %></div>\n<% } %>\n</body></html>'
    const afterCompile = '<html><body>  hello <div>0</div>  <div>1</div>  </body></html>'
    const obj = {
      name: 'hello',
    }
    let result = regTemplate(equalTmpl, obj)
    assert.equal(result, afterCompile)
  })

  it('with single quote', function () {
    const equalTmpl = '<html><body class="\'\'">\n\t<%= name %><% for(var i = 0; i < 2; i++) {%>\n<div onclick="\'\'"><%= i %></div>\n<% } %>\n<div class="\'\'"></div></body></html>'
    const afterCompile = '<html><body class="\'\'">  hello <div onclick="\'\'">0</div>  <div onclick="\'\'">1</div>  <div class="\'\'"></div></body></html>'
    const obj = {
      name: 'hello',
    }
    let result = regTemplate(equalTmpl, obj)
    assert.equal(result, afterCompile)
  })
})
