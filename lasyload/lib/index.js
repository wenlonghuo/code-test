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
