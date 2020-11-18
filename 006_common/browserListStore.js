/**
 * 以 localhostStorage 存储列表信息
 * data 存储方式
 * { storeKey: 'list_store_item', list: [ { time: 15333333000, } ] }
 */
// {
//   storeKey: 'list_store_item',
//   map: {
//     'ip+port+repo': '名称'
//   },
//   list: [
//     {
//       lastTime: 15333333000,// 最后一次调用时间
//       count: 1,// 调用次数
//       repo: '', // 调用的仓库名称
//       id: 'ip+port', // 独立的 key
//       data: {
//         host: 'aaa',
//         port: 'bbb',
//         password: 'ccc',
//         dir: 'ccc'
//       }
//     }
//   ]
// }
export default class ListStore {
  constructor ({ key, unique = (data) => { return data.host + data.port } }) {
    this.store = window.localStorage || window.sessionStorage
    this.storeKey = `list_store_${key}`
    this.unique = unique
    this.storeData = this.getFromStore()
  }
  getFromStore () {
    const str = this.store.getItem(this.storeKey)
    const defaultData = {
      storeKey: this.storeKey,
      map: {},
      list: []
    }
    try {
      const data = str ? JSON.parse(str) : defaultData
      return data
    } catch (e) {
      return defaultData
    }
  }
  saveToStore () {
    this.store.setItem(this.storeKey, JSON.stringify(this.storeData))
  }
  getList (repo = '') {
    const list = this.storeData.list
    const targetList = list.filter(item => item.repo === repo)
    const otherList = list.filter(item => item.repo !== repo)
    return {
      target: this.sortList(targetList).map(item => ({ ...item, name: this.storeData.map[`${item.repo}${item.id}`] })),
      other: this.sortList(otherList).map(item => ({ ...item, name: this.storeData.map[`${item.repo}${item.id}`] }))
    }
  }
  // 前三以时间排序，其他以次数排序
  sortList (source = []) {
    const list = [...source]
    // 以时间排序, 倒序
    list.sort((a, b) => b.lastTime - a.lastTime)
    const head = list.slice(0, 3)
    const other = list.slice(3, list.length).sort((a, b) => b.count - a.count)
    return [...head, ...other]
  }
  saveItem (repo = '', data) {
    data = { ...data }
    const id = this.unique(data)
    const existOne = this.getTargetItem(repo, id)
    const lastTime = Date.now()
    if (!existOne) {
      this.storeData.list.push({
        lastTime,
        id,
        count: 1,
        repo,
        data
      })
    } else {
      Object.assign(existOne, {
        lastTime,
        count: existOne.count + 1,
        data
      })
    }
    this.saveToStore()
  }
  getTargetItem (repo, id) {
    const list = this.storeData.list
    return list.find(item => item.repo === repo && item.id === id)
  }
  rename (repo = '', data, name) {
    const id = this.unique(data)
    const target = this.getTargetItem(repo, id)
    if (!target) {
      console.error(`目标不存在${repo}, ${JSON.stringify(data)}`)
      return
    }
    this.storeData.map[`${repo}${id}`] = name
    this.saveToStore()
  }
  delete (repo = '', data) {
    const id = this.unique(data)
    const list = this.storeData.list
    const index = list.findIndex(item => item.repo === repo && item.id === id)
    if (!~index) {
      console.error(`目标不存在${repo}, ${JSON.stringify(data)}`)
      return
    }
    this.storeData.map[`${repo}${id}`] = undefined
    list.splice(index, 1)
    this.saveToStore()
  }
}
