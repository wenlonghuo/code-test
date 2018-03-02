const thrift = require('thrift')

const Todo = require('./gen-nodejs/Todo')
const tTypes = require('./gen-nodejs/todo_types')

const data = []
let gid = 0

const actions = {
  getTodoList () {
    return data
  },
  getTotalLength () {
    return data.length
  },
  postTodo (item) {
    const result = new tTypes.ListItem({
      content: item.content,
      author: item.author,
      status: tTypes.Status.NORMAL,
      textLength: item.content.length,
      id: ++gid
    })
    data.push(result)
    return 0
  },
  doneArtical (id) {
    const result = data.find(item => item.id === id)
    if (!result) {
      throw new tTypes.CodeError({code: 1, message: '请选择条目！'})
    }
    result.status = tTypes.Status.DONE
    return result
  },
  deleteArtical (id) {
    const index = data.findIndex(item => item.id === id)
    const result = data[index]
    if (!~result) {
      throw new tTypes.CodeError({code: 1, message: '请选择条目！'})
    }
    data.splice(index, 1)
    return result
  }
}

const serverOptions = {
  files: '.',
  cors: {
    '*': true
  },
  services: {
    '/': {
      transport: thrift.TBufferedTransport,
      protocol: thrift.TJSONProtocol,
      processor: Todo,
      handler: actions,
    }
  }
}

const server = thrift.createWebServer(serverOptions)

server.listen(7878, () => {
  console.log(`监听端口：${7878}`)
})
