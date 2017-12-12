(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
let dealPic = require('../lib/index')

dealPic('.big-pic')

},{"../lib/index":2}],2:[function(require,module,exports){
'use strict'

function replaceSrc (changes) {
  changes.forEach(change => {
    if (change.intersectionRatio <= 0) return
    let item = change.target

    let src = item.getAttribute('data-src')
    let img = new Image()
    img.onload = function () {
      item.setAttribute('src', src)
    }
    img.src = src

    // observer.unobserve(item)
  })
}

module.exports = function (selector) {
  let els = document.querySelectorAll(selector)

  let observer = new IntersectionObserver(replaceSrc.bind());
  [].forEach.call(els, (item) => {
    observer.observe(item)
  })
}

},{}]},{},[1]);
