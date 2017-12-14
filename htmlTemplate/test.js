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
  
  it('variable', function () {
    const equalTmpl = '<html><body><%= name %><% for(var i = 0; i < 2; i++) {%><div><%= i %></div><% } %></body></html>'
    const afterCompile = '<html><body>hello<div>0</div><div>1</div></body></html>'
    const obj = {
      name: 'hello',
    }
    let result = regTemplate(equalTmpl, obj)
    assert.equal(result, afterCompile)
  })
})
